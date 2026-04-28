# Selenium Test Summary

- Generated at: 2026-04-24T13:02:07.234647+00:00
- Base URL: http://localhost:3000
- Browser: chrome
- Headless: true
- Duration (s): 115.37

## Totals

- Total: 16
- Passed: 9
- Failed: 0
- Errors: 4
- Skipped: 3

## Details

- PASSED - test_01_home_page_shows_login_panel (tests.selenium.test_home.HomePageSeleniumTests.test_01_home_page_shows_login_panel)
- PASSED - test_02_invalid_login_shows_error (tests.selenium.test_home.HomePageSeleniumTests.test_02_invalid_login_shows_error)
- PASSED - test_03_student_theme_submission_success_and_errors (tests.selenium.test_home.HomePageSeleniumTests.test_03_student_theme_submission_success_and_errors)
- ERROR - test_04_teacher_validates_cd_with_options_and_errors (tests.selenium.test_home.HomePageSeleniumTests.test_04_teacher_validates_cd_with_options_and_errors)

```text
Traceback (most recent call last):
  File "/home/okcid/Documents/handal/tests/selenium/test_home.py", line 253, in test_04_teacher_validates_cd_with_options_and_errors
    theme_id = self.panel_input("Validation locale / Analyse", "Theme ID")
  File "/home/okcid/Documents/handal/tests/selenium/test_home.py", line 49, in panel_input
    return self.wait.until(
           ~~~~~~~~~~~~~~~^
        EC.presence_of_element_located(
        ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    ...<4 lines>...
        )
        ^
    )
    ^
  File "/home/okcid/.pyenv/versions/3.14.3/lib/python3.14/site-packages/selenium/webdriver/support/wait.py", line 121, in until
    raise TimeoutException(message, screen, stacktrace)
selenium.common.exceptions.TimeoutException: Message: 
Stacktrace:
#0 0x55816d6b479a <unknown>
#1 0x55816d0b0215 <unknown>
#2 0x55816d102f06 <unknown>
#3 0x55816d103141 <unknown>
#4 0x55816d14e634 <unknown>
#5 0x55816d14b7d0 <unknown>
#6 0x55816d0f655f <unknown>
#7 0x55816d0f7321 <unknown>
#8 0x55816d67806b <unknown>
#9 0x55816d67b01d <unknown>
#10 0x55816d664718 <unknown>
#11 0x55816d67bbb0 <unknown>
#12 0x55816d64b150 <unknown>
#13 0x55816d6a15e8 <unknown>
#14 0x55816d6a17b8 <unknown>
#15 0x55816d6b31de <unknown>
#16 0x7f9554f6bb7b <unknown>
```

- ERROR - test_05_da_validation_options_and_errors (tests.selenium.test_home.HomePageSeleniumTests.test_05_da_validation_options_and_errors)

```text
Traceback (most recent call last):
  File "/home/okcid/Documents/handal/tests/selenium/test_home.py", line 294, in test_05_da_validation_options_and_errors
    theme_id = self.panel_input("Validation académique", "Theme ID")
               ~~~~~~~~~~~~~~~~^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "/home/okcid/Documents/handal/tests/selenium/test_home.py", line 49, in panel_input
    return self.wait.until(
           ~~~~~~~~~~~~~~~^
        EC.presence_of_element_located(
        ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    ...<4 lines>...
        )
        ^
    )
    ^
  File "/home/okcid/.pyenv/versions/3.14.3/lib/python3.14/site-packages/selenium/webdriver/support/wait.py", line 121, in until
    raise TimeoutException(message, screen, stacktrace)
selenium.common.exceptions.TimeoutException: Message: 
Stacktrace:
#0 0x55816d6b479a <unknown>
#1 0x55816d0b0215 <unknown>
#2 0x55816d102f06 <unknown>
#3 0x55816d103141 <unknown>
#4 0x55816d14e634 <unknown>
#5 0x55816d14b7d0 <unknown>
#6 0x55816d0f655f <unknown>
#7 0x55816d0f7321 <unknown>
#8 0x55816d67806b <unknown>
#9 0x55816d67b01d <unknown>
#10 0x55816d664718 <unknown>
#11 0x55816d67bbb0 <unknown>
#12 0x55816d64b150 <unknown>
#13 0x55816d6a15e8 <unknown>
#14 0x55816d6a17b8 <unknown>
#15 0x55816d6b31de <unknown>
#16 0x7f9554f6bb7b <unknown>
```

- ERROR - test_06_student_upload_and_auto_test (tests.selenium.test_home.HomePageSeleniumTests.test_06_student_upload_and_auto_test)

```text
Traceback (most recent call last):
  File "/home/okcid/Documents/handal/tests/selenium/test_home.py", line 371, in test_06_student_upload_and_auto_test
    doc_theme = self.panel_input("Dépôt du mémoire", "Theme ID")
                ~~~~~~~~~~~~~~~~^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "/home/okcid/Documents/handal/tests/selenium/test_home.py", line 49, in panel_input
    return self.wait.until(
           ~~~~~~~~~~~~~~~^
        EC.presence_of_element_located(
        ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    ...<4 lines>...
        )
        ^
    )
    ^
  File "/home/okcid/.pyenv/versions/3.14.3/lib/python3.14/site-packages/selenium/webdriver/support/wait.py", line 121, in until
    raise TimeoutException(message, screen, stacktrace)
selenium.common.exceptions.TimeoutException: Message: 
Stacktrace:
#0 0x55816d6b479a <unknown>
#1 0x55816d0b0215 <unknown>
#2 0x55816d102f06 <unknown>
#3 0x55816d103141 <unknown>
#4 0x55816d14e634 <unknown>
#5 0x55816d14b7d0 <unknown>
#6 0x55816d0f655f <unknown>
#7 0x55816d0f7321 <unknown>
#8 0x55816d67806b <unknown>
#9 0x55816d67b01d <unknown>
#10 0x55816d664718 <unknown>
#11 0x55816d67bbb0 <unknown>
#12 0x55816d64b150 <unknown>
#13 0x55816d6a15e8 <unknown>
#14 0x55816d6a17b8 <unknown>
#15 0x55816d6b31de <unknown>
#16 0x7f9554f6bb7b <unknown>
```

- SKIPPED - test_07_teacher_analyzes_document (tests.selenium.test_home.HomePageSeleniumTests.test_07_teacher_analyzes_document)

```text
Missing prerequisite state: document_id
```

- SKIPPED - test_08_da_creates_deliberation (tests.selenium.test_home.HomePageSeleniumTests.test_08_da_creates_deliberation)

```text
Missing prerequisite state: report_id
```

- PASSED - test_09_other_role_logins_work (tests.selenium.test_home.HomePageSeleniumTests.test_09_other_role_logins_work)
- PASSED - test_10_logout_redirects_to_home (tests.selenium.test_home.HomePageSeleniumTests.test_10_logout_redirects_to_home)
- PASSED - test_11_teacher_sidebar_navigation (tests.selenium.test_home.HomePageSeleniumTests.test_11_teacher_sidebar_navigation)
- PASSED - test_12_da_sidebar_navigation (tests.selenium.test_home.HomePageSeleniumTests.test_12_da_sidebar_navigation)
- ERROR - test_13_admin_sidebar_navigation (tests.selenium.test_home.HomePageSeleniumTests.test_13_admin_sidebar_navigation)

```text
Traceback (most recent call last):
  File "/home/okcid/Documents/handal/tests/selenium/test_home.py", line 522, in test_13_admin_sidebar_navigation
    self.wait.until(
    ~~~~~~~~~~~~~~~^
        EC.element_to_be_clickable(
        ^^^^^^^^^^^^^^^^^^^^^^^^^^^
            (By.XPATH, '//button[.//span[normalize-space()="Documents de référence"]]')
            ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
        )
        ^
    ).click()
    ^
  File "/home/okcid/.pyenv/versions/3.14.3/lib/python3.14/site-packages/selenium/webdriver/support/wait.py", line 121, in until
    raise TimeoutException(message, screen, stacktrace)
selenium.common.exceptions.TimeoutException: Message: 
Stacktrace:
#0 0x55816d6b479a <unknown>
#1 0x55816d0b0215 <unknown>
#2 0x55816d102f06 <unknown>
#3 0x55816d103141 <unknown>
#4 0x55816d14e634 <unknown>
#5 0x55816d14b7d0 <unknown>
#6 0x55816d0f655f <unknown>
#7 0x55816d0f7321 <unknown>
#8 0x55816d67806b <unknown>
#9 0x55816d67b01d <unknown>
#10 0x55816d664718 <unknown>
#11 0x55816d67bbb0 <unknown>
#12 0x55816d64b150 <unknown>
#13 0x55816d6a15e8 <unknown>
#14 0x55816d6a17b8 <unknown>
#15 0x55816d6b31de <unknown>
#16 0x7f9554f6bb7b <unknown>
```

- SKIPPED - test_14_student_verdict_rewrite_flow (tests.selenium.test_home.HomePageSeleniumTests.test_14_student_verdict_rewrite_flow)
Vérifie que la vue réécriture s'affiche si une délibération REWRITE_REQUIRED existe.

```text
Missing prerequisite state: report_id
```

- PASSED - test_15_login_mode_toggle (tests.selenium.test_home.HomePageSeleniumTests.test_15_login_mode_toggle)
Vérifie que le toggle Etudiant/Personnel change le placeholder du champ login.
- PASSED - test_16_demo_account_selector_fills_form (tests.selenium.test_home.HomePageSeleniumTests.test_16_demo_account_selector_fills_form)
Vérifie que le sélecteur de comptes de démo pré-remplit les champs.
