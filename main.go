package main

import (
	"net/http"
	"iac"
)

func main() {
	logonController := &iac.LogonController{}
	logonController.RegisterRoutes()
	http.ListenAndServe(":8080", nil)
}


