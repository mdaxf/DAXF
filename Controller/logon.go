package iac

import (
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"github.com/golang-jwt/jwt"
)

// LogonController ...

type LogonController struct {

}

type User struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

func (c *LogonController) LogonHandler(w http.ResponseWriter, r *http.Request) {
	var user User
	decoder := json.NewDecoder(r.Body)
	err := decoder.Decode(&user)
	if err != nil {
		panic(err)
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	
	// Validate the user's credentials here
	if user.Username != "abc" || user.Password != "12345" {
		http.Error(w, "Invalid username or password", http.StatusUnauthorized)
		return
	}
	// Generate a token for the user
	token, err := c.generatetoken()
	if err != nil {
		http.Error(w, "Error generating token", http.StatusInternalServerError)
		return
	}
	// Return the token as JSON
	response := map[string]string{"token": token}
	json.NewEncoder(w).Encode(response)
}

func (c *LogonController) RegisterRoutes() {
	http.HandleFunc("/logon", c.LogonHandler)
}

func (c *LogonController) generatetoken() (string, error) {
	// Define the secret key used to sign the token
	secret := []byte("seceret words")

	// Define the token claims
	claims := jwt.MapClaims{
		"sub":  "1234567890",
		"name": "John Doe",
		"iat":  time.Now().Unix(),
		"exp":  time.Now().Add(time.Hour * 24).Unix(),
	}

	// Generate the token
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	signedToken, err := token.SignedString(secret)
	if err != nil {
		fmt.Println("Error generating token:", err)
		return "", err
	}
	return signedToken, nil
}