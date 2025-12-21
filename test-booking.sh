#!/bin/bash

# Calculate date 2 days from now
BOOKING_DATE=$(date -d '+2 days' +%Y-%m-%d)

echo "==================================================="
echo "Testing Demo Booking - Google Calendar Integration"
echo "==================================================="
echo "Booking Date: $BOOKING_DATE"
echo "Booking Time: 10:00 AM"
echo "==================================================="
echo ""

# Submit the booking via curl with proper form data
curl -v -X POST "http://localhost:8001/demo-booking" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -H "Accept: text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8" \
  -H "X-Requested-With: XMLHttpRequest" \
  -d "name=Test User" \
  -d "email=bisinleabdi@gmail.com" \
  -d "phone=+254712345678" \
  -d "school_name=Test School Academy" \
  -d "date=$BOOKING_DATE" \
  -d "time=10:00 AM" \
  -d "message=Test booking for Google Calendar integration and email notifications"

echo ""
echo ""
echo "==================================================="
echo "Please check:"
echo "1. Google Calendar (bisinleabdi@gmail.com)"
echo "2. Email inbox for notifications"
echo "3. Event should have Google Meet link"
echo "==================================================="

