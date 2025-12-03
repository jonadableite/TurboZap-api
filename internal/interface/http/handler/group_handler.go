package handler

import (
	"fmt"
	"strings"

	"github.com/gofiber/fiber/v2"
	"github.com/jonadableite/turbozap-api/internal/domain/entity"
	"github.com/jonadableite/turbozap-api/internal/domain/repository"
	"github.com/jonadableite/turbozap-api/internal/infrastructure/whatsapp"
	"github.com/jonadableite/turbozap-api/internal/interface/response"
	"github.com/jonadableite/turbozap-api/pkg/validator"
	"go.mau.fi/whatsmeow"
	"go.mau.fi/whatsmeow/types"
	"go.uber.org/zap"
)

// GroupHandler handles group-related requests
type GroupHandler struct {
	instanceRepo repository.InstanceRepository
	waManager    *whatsapp.Manager
	logger       *zap.Logger
}

// NewGroupHandler creates a new group handler
func NewGroupHandler(instanceRepo repository.InstanceRepository, waManager *whatsapp.Manager, logger *zap.Logger) *GroupHandler {
	return &GroupHandler{
		instanceRepo: instanceRepo,
		waManager:    waManager,
		logger:       logger,
	}
}

func (h *GroupHandler) getInstanceAndValidate(c *fiber.Ctx) (*entity.Instance, *whatsapp.Client, error) {
	instanceName := c.Params("instance")
	if instanceName == "" {
		return nil, nil, response.BadRequest(c, "Instance name is required")
	}

	instance, err := h.instanceRepo.GetByName(c.Context(), instanceName)
	if err != nil {
		h.logger.Error("Failed to get instance", zap.Error(err))
		return nil, nil, response.InternalServerError(c, "Failed to get instance")
	}
	if instance == nil {
		return nil, nil, response.NotFound(c, "Instance not found")
	}

	client, exists := h.waManager.GetClient(instance.ID)
	if !exists || !client.WAClient.IsConnected() {
		return nil, nil, response.BadRequest(c, "Instance is not connected to WhatsApp")
	}

	return instance, client, nil
}

// CreateGroup creates a new group
func (h *GroupHandler) CreateGroup(c *fiber.Ctx) error {
	_, client, err := h.getInstanceAndValidate(c)
	if err != nil {
		return err
	}

	var req entity.CreateGroupRequest
	if err := c.BodyParser(&req); err != nil {
		return response.BadRequest(c, "Invalid request body")
	}

	if req.Name == "" {
		return response.BadRequest(c, "Group name is required")
	}

	// Parse participant JIDs
	participants := make([]types.JID, 0, len(req.Participants))
	for _, p := range req.Participants {
		jidStr, valid := validator.JID(p)
		if !valid {
			continue
		}
		jid, err := types.ParseJID(jidStr)
		if err != nil {
			continue
		}
		participants = append(participants, jid)
	}

	// Create group
	groupInfo, err := client.WAClient.CreateGroup(c.Context(), whatsmeow.ReqCreateGroup{
		Name:         req.Name,
		Participants: participants,
	})
	if err != nil {
		h.logger.Error("Failed to create group", zap.Error(err))
		return response.InternalServerError(c, "Failed to create group")
	}

	return response.Success(c, entity.CreateGroupResponse{
		JID:  groupInfo.JID.String(),
		Name: groupInfo.GroupName.Name,
	})
}

// ListGroups lists all groups
func (h *GroupHandler) ListGroups(c *fiber.Ctx) error {
	_, client, err := h.getInstanceAndValidate(c)
	if err != nil {
		return err
	}

	groups, err := client.WAClient.GetJoinedGroups(c.Context())
	if err != nil {
		h.logger.Error("Failed to list groups", zap.Error(err))
		return response.InternalServerError(c, "Failed to list groups")
	}

	result := make([]entity.GroupInfo, len(groups))
	for i, g := range groups {
		participants := make([]entity.GroupParticipant, len(g.Participants))
		for j, p := range g.Participants {
			participants[j] = entity.GroupParticipant{
				JID:          p.JID.String(),
				IsAdmin:      p.IsAdmin,
				IsSuperAdmin: p.IsSuperAdmin,
			}
		}

		result[i] = entity.GroupInfo{
			JID:              g.JID.String(),
			Name:             g.Name,
			Topic:            g.Topic,
			ParticipantCount: len(g.Participants),
			Participants:     participants,
			IsAnnounce:       g.IsAnnounce,
			IsLocked:         g.IsLocked,
		}
	}

	return response.Success(c, fiber.Map{
		"groups": result,
		"total":  len(result),
	})
}

// GetGroupInfo gets information about a specific group
func (h *GroupHandler) GetGroupInfo(c *fiber.Ctx) error {
	_, client, err := h.getInstanceAndValidate(c)
	if err != nil {
		return err
	}

	groupID := c.Params("groupId")
	if groupID == "" {
		return response.BadRequest(c, "Group ID is required")
	}

	jidStr, valid := validator.GroupJID(groupID)
	if !valid {
		return response.BadRequest(c, "Invalid group ID")
	}

	jid, err := types.ParseJID(jidStr)
	if err != nil {
		return response.BadRequest(c, "Invalid group ID format")
	}

	groupInfo, err := client.WAClient.GetGroupInfo(c.Context(), jid)
	if err != nil {
		h.logger.Error("Failed to get group info", zap.Error(err))
		return response.InternalServerError(c, "Failed to get group info")
	}

	participants := make([]entity.GroupParticipant, len(groupInfo.Participants))
	for i, p := range groupInfo.Participants {
		participants[i] = entity.GroupParticipant{
			JID:          p.JID.String(),
			IsAdmin:      p.IsAdmin,
			IsSuperAdmin: p.IsSuperAdmin,
		}
	}

	result := entity.GroupInfo{
		JID:              groupInfo.JID.String(),
		Name:             groupInfo.Name,
		Topic:            groupInfo.Topic,
		Owner:            groupInfo.OwnerJID.String(),
		Created:          groupInfo.GroupCreated,
		ParticipantCount: len(groupInfo.Participants),
		Participants:     participants,
		IsAnnounce:       groupInfo.IsAnnounce,
		IsLocked:         groupInfo.IsLocked,
	}

	// Get profile picture
	picInfo, err := client.WAClient.GetProfilePictureInfo(c.Context(), jid, &whatsmeow.GetProfilePictureParams{})
	if err == nil && picInfo != nil {
		result.ProfilePic = picInfo.URL
	}

	return response.Success(c, result)
}

// ManageParticipants adds or removes participants from a group
func (h *GroupHandler) ManageParticipants(c *fiber.Ctx) error {
	_, client, err := h.getInstanceAndValidate(c)
	if err != nil {
		return err
	}

	groupID := c.Params("groupId")
	if groupID == "" {
		return response.BadRequest(c, "Group ID is required")
	}

	jidStr, valid := validator.GroupJID(groupID)
	if !valid {
		return response.BadRequest(c, "Invalid group ID")
	}

	groupJID, err := types.ParseJID(jidStr)
	if err != nil {
		return response.BadRequest(c, "Invalid group ID format")
	}

	var req entity.ManageParticipantsRequest
	if err := c.BodyParser(&req); err != nil {
		return response.BadRequest(c, "Invalid request body")
	}

	if len(req.Participants) == 0 {
		return response.BadRequest(c, "At least one participant is required")
	}

	// Parse participant JIDs
	participantJIDs := make([]types.JID, 0, len(req.Participants))
	for _, p := range req.Participants {
		pJIDStr, valid := validator.JID(p)
		if !valid {
			continue
		}
		pJID, err := types.ParseJID(pJIDStr)
		if err != nil {
			continue
		}
		participantJIDs = append(participantJIDs, pJID)
	}

	if len(participantJIDs) == 0 {
		return response.BadRequest(c, "No valid participants provided")
	}

	// Determine action
	var changeResults []types.GroupParticipant
	switch strings.ToLower(req.Action) {
	case "add":
		changeResults, err = client.WAClient.UpdateGroupParticipants(c.Context(), groupJID, participantJIDs, whatsmeow.ParticipantChangeAdd)
	case "remove":
		changeResults, err = client.WAClient.UpdateGroupParticipants(c.Context(), groupJID, participantJIDs, whatsmeow.ParticipantChangeRemove)
	case "promote":
		changeResults, err = client.WAClient.UpdateGroupParticipants(c.Context(), groupJID, participantJIDs, whatsmeow.ParticipantChangePromote)
	case "demote":
		changeResults, err = client.WAClient.UpdateGroupParticipants(c.Context(), groupJID, participantJIDs, whatsmeow.ParticipantChangeDemote)
	default:
		return response.BadRequest(c, "Invalid action. Use: add, remove, promote, or demote")
	}

	if err != nil {
		h.logger.Error("Failed to manage participants", zap.Error(err))
		return response.InternalServerError(c, "Failed to manage participants")
	}

	results := make([]entity.ManageParticipantsResponse, len(changeResults))
	for i, r := range changeResults {
		status := "success"
		errMsg := ""
		if r.Error != 0 {
			status = "failed"
			errMsg = fmt.Sprintf("Error code: %d", r.Error)
		}
		results[i] = entity.ManageParticipantsResponse{
			Participant: r.JID.String(),
			Action:      req.Action,
			Status:      status,
			Error:       errMsg,
		}
	}

	return response.Success(c, fiber.Map{
		"results": results,
	})
}

// JoinGroup joins a group via invite link
func (h *GroupHandler) JoinGroup(c *fiber.Ctx) error {
	_, client, err := h.getInstanceAndValidate(c)
	if err != nil {
		return err
	}

	var req entity.JoinGroupRequest
	if err := c.BodyParser(&req); err != nil {
		return response.BadRequest(c, "Invalid request body")
	}

	if req.InviteCode == "" {
		return response.BadRequest(c, "Invite code is required")
	}

	// Extract code from full link if provided
	inviteCode := req.InviteCode
	if strings.Contains(inviteCode, "chat.whatsapp.com/") {
		parts := strings.Split(inviteCode, "chat.whatsapp.com/")
		if len(parts) > 1 {
			inviteCode = parts[1]
		}
	}

	groupJID, err := client.WAClient.JoinGroupWithLink(c.Context(), inviteCode)
	if err != nil {
		h.logger.Error("Failed to join group", zap.Error(err))
		return response.InternalServerError(c, "Failed to join group: "+err.Error())
	}

	// Get group info
	groupInfo, err := client.WAClient.GetGroupInfo(c.Context(), groupJID)
	groupName := ""
	if err == nil && groupInfo != nil {
		groupName = groupInfo.Name
	}

	return response.Success(c, entity.JoinGroupResponse{
		JID:  groupJID.String(),
		Name: groupName,
	})
}

// LeaveGroup leaves a group
func (h *GroupHandler) LeaveGroup(c *fiber.Ctx) error {
	_, client, err := h.getInstanceAndValidate(c)
	if err != nil {
		return err
	}

	groupID := c.Params("groupId")
	if groupID == "" {
		return response.BadRequest(c, "Group ID is required")
	}

	jidStr, valid := validator.GroupJID(groupID)
	if !valid {
		return response.BadRequest(c, "Invalid group ID")
	}

	groupJID, err := types.ParseJID(jidStr)
	if err != nil {
		return response.BadRequest(c, "Invalid group ID format")
	}

	err = client.WAClient.LeaveGroup(c.Context(), groupJID)
	if err != nil {
		h.logger.Error("Failed to leave group", zap.Error(err))
		return response.InternalServerError(c, "Failed to leave group")
	}

	return response.Success(c, fiber.Map{
		"message": "Left group successfully",
	})
}

// GetInviteLink gets the group invite link
func (h *GroupHandler) GetInviteLink(c *fiber.Ctx) error {
	_, client, err := h.getInstanceAndValidate(c)
	if err != nil {
		return err
	}

	groupID := c.Params("groupId")
	if groupID == "" {
		return response.BadRequest(c, "Group ID is required")
	}

	jidStr, valid := validator.GroupJID(groupID)
	if !valid {
		return response.BadRequest(c, "Invalid group ID")
	}

	groupJID, err := types.ParseJID(jidStr)
	if err != nil {
		return response.BadRequest(c, "Invalid group ID format")
	}

	// Check if reset is requested
	var reset bool
	if c.Query("reset") == "true" {
		reset = true
	}

	var inviteCode string
	if reset {
		inviteCode, err = client.WAClient.GetGroupInviteLink(c.Context(), groupJID, true)
	} else {
		inviteCode, err = client.WAClient.GetGroupInviteLink(c.Context(), groupJID, false)
	}

	if err != nil {
		h.logger.Error("Failed to get invite link", zap.Error(err))
		return response.InternalServerError(c, "Failed to get invite link")
	}

	return response.Success(c, entity.GroupInviteResponse{
		InviteCode: inviteCode,
		InviteLink: "https://chat.whatsapp.com/" + inviteCode,
	})
}

// UpdateGroupInfo updates group name, topic, or description
func (h *GroupHandler) UpdateGroupInfo(c *fiber.Ctx) error {
	_, client, err := h.getInstanceAndValidate(c)
	if err != nil {
		return err
	}

	groupID := c.Params("groupId")
	if groupID == "" {
		return response.BadRequest(c, "Group ID is required")
	}

	jidStr, valid := validator.GroupJID(groupID)
	if !valid {
		return response.BadRequest(c, "Invalid group ID")
	}

	groupJID, err := types.ParseJID(jidStr)
	if err != nil {
		return response.BadRequest(c, "Invalid group ID format")
	}

	var req entity.UpdateGroupRequest
	if err := c.BodyParser(&req); err != nil {
		return response.BadRequest(c, "Invalid request body")
	}

	// Update name if provided
	if req.Name != "" {
		err = client.WAClient.SetGroupName(c.Context(), groupJID, req.Name)
		if err != nil {
			h.logger.Error("Failed to update group name", zap.Error(err))
			return response.InternalServerError(c, "Failed to update group name")
		}
	}

	// Update topic if provided
	if req.Topic != "" {
		err = client.WAClient.SetGroupTopic(c.Context(), groupJID, "", "", req.Topic)
		if err != nil {
			h.logger.Error("Failed to update group topic", zap.Error(err))
			return response.InternalServerError(c, "Failed to update group topic")
		}
	}

	return response.Success(c, fiber.Map{
		"message": "Group info updated successfully",
	})
}
