package dto

// UpdateInstanceNameRequest represents a request to update an instance name
type UpdateInstanceNameRequest struct {
	Name string `json:"name" validate:"required,min=1,max=100"`
}

// UpdateInstanceNameResponse represents the response after updating instance name
type UpdateInstanceNameResponse struct {
	OldName string `json:"old_name"`
	NewName string `json:"new_name"`
	Message string `json:"message"`
}

// SetProfileStatusRequest represents a request to set the "about" text in WhatsApp profile
type SetProfileStatusRequest struct {
	Status string `json:"status" validate:"required,max=500"`
}

// SetProfileStatusResponse represents the response after setting profile status
type SetProfileStatusResponse struct {
	Status  string `json:"status"`
	Message string `json:"message"`
}

// PrivacySetting represents a privacy setting value
type PrivacySetting string

const (
	PrivacySettingAll      PrivacySetting = "all"
	PrivacySettingContacts PrivacySetting = "contacts"
	PrivacySettingNone     PrivacySetting = "none"
)

// PrivacySettingsResponse represents the privacy settings of the WhatsApp account
type PrivacySettingsResponse struct {
	GroupAdd     string `json:"group_add"`      // all, contacts, contact_blacklist
	LastSeen     string `json:"last_seen"`      // all, contacts, contact_blacklist, none
	Status       string `json:"status"`         // all, contacts, contact_blacklist, none
	Profile      string `json:"profile"`        // all, contacts, contact_blacklist, none
	ReadReceipts string `json:"read_receipts"`  // all, none
	Online       string `json:"online"`         // all, match_last_seen
	CallAdd      string `json:"call_add"`       // all, known
}

// SetPrivacySettingRequest represents a request to set a specific privacy setting
type SetPrivacySettingRequest struct {
	Setting string `json:"setting" validate:"required"` // group_add, last_seen, status, profile, read_receipts, online, call_add
	Value   string `json:"value" validate:"required"`   // all, contacts, contact_blacklist, none, match_last_seen, known
}

// SetPrivacySettingResponse represents the response after setting a privacy setting
type SetPrivacySettingResponse struct {
	Setting  string                  `json:"setting"`
	Value    string                  `json:"value"`
	Message  string                  `json:"message"`
	Settings PrivacySettingsResponse `json:"settings"`
}

// RejectCallRequest represents a request to reject an incoming call
type RejectCallRequest struct {
	CallFrom string `json:"call_from" validate:"required"` // JID of the caller
	CallID   string `json:"call_id" validate:"required"`   // Call identifier
}

// RejectCallResponse represents the response after rejecting a call
type RejectCallResponse struct {
	CallFrom string `json:"call_from"`
	CallID   string `json:"call_id"`
	Message  string `json:"message"`
}
