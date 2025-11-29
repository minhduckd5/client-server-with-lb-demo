package protocol

import "encoding/json"

// Request represents a client request message
type Request struct {
	Type     string          `json:"type"`
	Username string          `json:"username,omitempty"`
	Email    string          `json:"email,omitempty"`
	Password string          `json:"password,omitempty"`
	Token    string          `json:"token,omitempty"`
	Data     json.RawMessage `json:"data,omitempty"`
}

// Response represents a server response message
type Response struct {
	Status  string          `json:"status"`
	Message string          `json:"message,omitempty"`
	Data    json.RawMessage `json:"data,omitempty"`
}

// SuccessResponse creates a success response
func SuccessResponse(data interface{}) (*Response, error) {
	dataBytes, err := json.Marshal(data)
	if err != nil {
		return nil, err
	}
	return &Response{
		Status: "success",
		Data:   dataBytes,
	}, nil
}

// ErrorResponse creates an error response
func ErrorResponse(message string) *Response {
	return &Response{
		Status:  "error",
		Message: message,
	}
}

// LoginResponseData contains login response data
type LoginResponseData struct {
	Token     string `json:"token"`
	UserID    string `json:"user_id"`
	Username  string `json:"username"`
	Email     string `json:"email"`
	ExpiresAt int64  `json:"expires_at"`
}

// RegisterResponseData contains registration response data
type RegisterResponseData struct {
	UserID   string `json:"user_id"`
	Username string `json:"username"`
	Email    string `json:"email"`
}

// ValidateResponseData contains token validation response data
type ValidateResponseData struct {
	Valid    bool   `json:"valid"`
	UserID   string `json:"user_id,omitempty"`
	Username string `json:"username,omitempty"`
	Email    string `json:"email,omitempty"`
}


