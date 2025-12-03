package entity

import (
	"time"

	"github.com/google/uuid"
)

// Group represents a WhatsApp group
type Group struct {
	ID          uuid.UUID         `json:"id"`
	InstanceID  uuid.UUID         `json:"instance_id"`
	JID         string            `json:"jid"`
	Name        string            `json:"name"`
	Topic       string            `json:"topic,omitempty"`
	Description string            `json:"description,omitempty"`
	Owner       string            `json:"owner"`
	Created     time.Time         `json:"created"`
	ProfilePic  string            `json:"profile_pic,omitempty"`
	Participants []GroupParticipant `json:"participants,omitempty"`
	CreatedAt   time.Time         `json:"created_at"`
	UpdatedAt   time.Time         `json:"updated_at"`
}

// GroupParticipant represents a participant in a group
type GroupParticipant struct {
	JID     string `json:"jid"`
	IsAdmin bool   `json:"is_admin"`
	IsSuperAdmin bool `json:"is_super_admin"`
}

// NewGroup creates a new group entity
func NewGroup(instanceID uuid.UUID, jid, name string) *Group {
	now := time.Now()
	return &Group{
		ID:         uuid.New(),
		InstanceID: instanceID,
		JID:        jid,
		Name:       name,
		CreatedAt:  now,
		UpdatedAt:  now,
	}
}

// GroupInfo represents group information from WhatsApp
type GroupInfo struct {
	JID            string             `json:"jid"`
	Name           string             `json:"name"`
	Topic          string             `json:"topic,omitempty"`
	Description    string             `json:"description,omitempty"`
	Owner          string             `json:"owner"`
	Created        time.Time          `json:"created"`
	ProfilePic     string             `json:"profile_pic,omitempty"`
	ParticipantCount int              `json:"participant_count"`
	Participants   []GroupParticipant `json:"participants"`
	IsAnnounce     bool               `json:"is_announce"`     // Only admins can send messages
	IsLocked       bool               `json:"is_locked"`       // Only admins can edit group info
	IsCommunity    bool               `json:"is_community"`
	LinkedParent   string             `json:"linked_parent,omitempty"`
}

// CreateGroupRequest represents a request to create a group
type CreateGroupRequest struct {
	Name         string   `json:"name"`
	Participants []string `json:"participants"`
}

// CreateGroupResponse represents the response after creating a group
type CreateGroupResponse struct {
	JID  string `json:"jid"`
	Name string `json:"name"`
}

// UpdateGroupRequest represents a request to update group info
type UpdateGroupRequest struct {
	Name        string `json:"name,omitempty"`
	Topic       string `json:"topic,omitempty"`
	Description string `json:"description,omitempty"`
}

// ManageParticipantsRequest represents a request to manage group participants
type ManageParticipantsRequest struct {
	Participants []string `json:"participants"`
	Action       string   `json:"action"` // add, remove, promote, demote
}

// ManageParticipantsResponse represents the response after managing participants
type ManageParticipantsResponse struct {
	Participant string `json:"participant"`
	Action      string `json:"action"`
	Status      string `json:"status"` // success, failed
	Error       string `json:"error,omitempty"`
}

// JoinGroupRequest represents a request to join a group via invite link
type JoinGroupRequest struct {
	InviteCode string `json:"invite_code"` // The code from the invite link
}

// JoinGroupResponse represents the response after joining a group
type JoinGroupResponse struct {
	JID  string `json:"jid"`
	Name string `json:"name"`
}

// GroupInviteRequest represents a request to get group invite link
type GroupInviteRequest struct {
	Reset bool `json:"reset,omitempty"` // If true, revoke current and generate new
}

// GroupInviteResponse represents the group invite link response
type GroupInviteResponse struct {
	InviteCode string `json:"invite_code"`
	InviteLink string `json:"invite_link"`
}

// LeaveGroupRequest represents a request to leave a group
type LeaveGroupRequest struct {
	GroupJID string `json:"group_jid"`
}

// UpdateGroupPictureRequest represents a request to update group picture
type UpdateGroupPictureRequest struct {
	ImageURL string `json:"image_url,omitempty"`
	Base64   string `json:"base64,omitempty"`
}

