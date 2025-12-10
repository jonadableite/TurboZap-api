//go:build ignore

package main

import (
	"fmt"
	"io/ioutil"
	"os"
	"regexp"
	"strings"
)

func main() {
	if len(os.Args) < 2 {
		fmt.Println("Usage: go run fix_logrus.go <file>")
		os.Exit(1)
	}

	file := os.Args[1]
	content, err := ioutil.ReadFile(file)
	if err != nil {
		fmt.Printf("Error reading file: %v\n", err)
		os.Exit(1)
	}

	s := string(content)

	// Remove empty logrus.WithField calls
	r1 := regexp.MustCompile(`logrus\.WithField\(\s*,\s*\)`)
	s = r1.ReplaceAllString(s, "")

	// Remove empty logrus.WithError calls
	r2 := regexp.MustCompile(`logrus\.WithError\(\s*\)`)
	s = r2.ReplaceAllString(s, "")

	// Clean up double commas
	r3 := regexp.MustCompile(`,\s*,`)
	s = r3.ReplaceAllString(s, ",")

	// Clean up trailing commas before closing paren
	r4 := regexp.MustCompile(`,\s*\)`)
	s = r4.ReplaceAllString(s, ")")

	// Clean up leading commas
	r5 := regexp.MustCompile(`\(\s*,`)
	s = r5.ReplaceAllString(s, "(")

	// Clean up empty function calls
	r6 := regexp.MustCompile(`\w+\.(Info|Warn|Error|Debug)\([^,]+,\s*\)`)
	s = r6.ReplaceAllStringFunc(s, func(match string) string {
		// Extract the method call and message
		parts := strings.Split(match, ",")
		if len(parts) > 0 {
			return strings.TrimSpace(parts[0]) + ")"
		}
		return match
	})

	err = ioutil.WriteFile(file, []byte(s), 0644)
	if err != nil {
		fmt.Printf("Error writing file: %v\n", err)
		os.Exit(1)
	}

	fmt.Printf("Fixed %s\n", file)
}
