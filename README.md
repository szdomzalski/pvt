# pvt


## Problems after Bootstrap 5 include
### Testing log:
1. It seems 100% correct attempt looks fine using spacebar
2. Program behaves incorrectly when "Too early" measurement happens. In such a case, following measurments contain:
- incorrect reaction time (e.g. 3 ms which is physically impossible) which also causes incorrect classification
- incorrect breaks between measurements (far too short breaks happen randomly)
- random "fail: no response" althoguh there was no measurement on the screen
3. Progrem behaves incorrectly when took too long for reaction - when test continues random "fail: no response" occur even though there was no such next attempt.