# Selenium Test Summary

- Generated at: 2026-04-23T13:31:13.736270+00:00
- Base URL: http://localhost:3000
- Browser: chrome
- Headless: true
- Duration (s): 104.15

## Totals

- Total: 16
- Passed: 7
- Failed: 1
- Errors: 2
- Skipped: 6

## Details

- PASSED - test_01_home_page_shows_login_panel (tests.selenium.test_home.HomePageSeleniumTests.test_01_home_page_shows_login_panel)
- FAILED - test_02_invalid_login_shows_error (tests.selenium.test_home.HomePageSeleniumTests.test_02_invalid_login_shows_error)

```text
Traceback (most recent call last):
  File [35m"/home/okcid/Documents/handal/tests/selenium/test_home.py"[0m, line [35m91[0m, in [35mwait_for_text[0m
    [31mself.wait.until[0m[1;31m([0m
    [31m~~~~~~~~~~~~~~~[0m[1;31m^[0m
        [1;31mEC.text_to_be_present_in_element((By.TAG_NAME, "body"), text_fragment)[0m
        [1;31m^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^[0m
    [1;31m)[0m
    [1;31m^[0m
  File [35m"/home/okcid/.pyenv/versions/3.14.3/lib/python3.14/site-packages/selenium/webdriver/support/wait.py"[0m, line [35m121[0m, in [35muntil[0m
    raise TimeoutException(message, screen, stacktrace)
[1;35mselenium.common.exceptions.TimeoutException[0m: [35mMessage: 
[0m

The above exception was the direct cause of the following exception:

Traceback (most recent call last):
  File [35m"/home/okcid/Documents/handal/tests/selenium/test_home.py"[0m, line [35m183[0m, in [35mtest_02_invalid_login_shows_error[0m
    [31mself.wait_for_text[0m[1;31m("Invalid credentials")[0m
    [31m~~~~~~~~~~~~~~~~~~[0m[1;31m^^^^^^^^^^^^^^^^^^^^^^^[0m
  File [35m"/home/okcid/Documents/handal/tests/selenium/test_home.py"[0m, line [35m96[0m, in [35mwait_for_text[0m
    raise AssertionError(
        f"Text fragment not found: {text_fragment}. body_excerpt={body_text[:1200]}"
    ) from error
[1;35mAssertionError[0m: [35mText fragment not found: Invalid credentials. body_excerpt=HANDAL
Academic Integrity Platform
Solutions
Workflow
Sécurité
Connexion
PLATEFORME ACADÉMIQUE
Handal orchestre la détection, la validation
et la délibération des mémoires.
Un flux académique structuré en trois phases — thème, document, verdict — pour chaque acteur de l'institution.
Explorer la plateforme
Etudiant
Personnel
INE
MOT DE PASSE
Se connecter
COMPTES DE DEMONSTRATION
Choisir un compte...
Etudiant - N01331820231
Enseignant - teacher@handal.local
DA - da@handal.local
Admin - admin@handal.local
MOTEUR
Tout ce dont une institution a besoin
Six modules intégrés couvrent l'intégralité du parcours académique, de la proposition du thème à la délibération finale.
MOTEUR
Détection multi-niveaux
Analyse du plagiat direct, de la paraphrase et des reformulations issues de traduction automatique sur un seul parcours.
REPORTING
Rapports exploitables
Résultats structurés, scores, décisions et traces d'analyse pour suivre un mémoire de bout en bout.
PROTECTION
Sécurité active
Contrôles same-origin, cookies signés et garde-fous serveur pour protéger les actions sensibles.
WORKFLOW
Flux par rôle
Espaces dédiés aux étudiants, enseignants, DA et administrateurs avec des étapes claires et con[0m
```

- ERROR - test_03_student_theme_submission_success_and_errors (tests.selenium.test_home.HomePageSeleniumTests.test_03_student_theme_submission_success_and_errors)

```text
Traceback (most recent call last):
  File [35m"/home/okcid/Documents/handal/tests/selenium/test_home.py"[0m, line [35m193[0m, in [35mtest_03_student_theme_submission_success_and_errors[0m
    title_input = [31mself.panel_input[0m[1;31m("Proposer un thème", "Titre")[0m
                  [31m~~~~~~~~~~~~~~~~[0m[1;31m^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^[0m
  File [35m"/home/okcid/Documents/handal/tests/selenium/test_home.py"[0m, line [35m49[0m, in [35mpanel_input[0m
    return [31mself.wait.until[0m[1;31m([0m
           [31m~~~~~~~~~~~~~~~[0m[1;31m^[0m
        [1;31mEC.presence_of_element_located([0m
        [1;31m^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^[0m
    ...<4 lines>...
        [1;31m)[0m
        [1;31m^[0m
    [1;31m)[0m
    [1;31m^[0m
  File [35m"/home/okcid/.pyenv/versions/3.14.3/lib/python3.14/site-packages/selenium/webdriver/support/wait.py"[0m, line [35m121[0m, in [35muntil[0m
    raise TimeoutException(message, screen, stacktrace)
[1;35mselenium.common.exceptions.TimeoutException[0m: [35mMessage: 
Stacktrace:
#0 0x564f10f5c79a <unknown>
#1 0x564f10958215 <unknown>
#2 0x564f109aaf06 <unknown>
#3 0x564f109ab141 <unknown>
#4 0x564f109f6634 <unknown>
#5 0x564f109f37d0 <unknown>
#6 0x564f1099e55f <unknown>
#7 0x564f1099f321 <unknown>
#8 0x564f10f2006b <unknown>
#9 0x564f10f2301d <unknown>
#10 0x564f10f0c718 <unknown>
#11 0x564f10f23bb0 <unknown>
#12 0x564f10ef3150 <unknown>
#13 0x564f10f495e8 <unknown>
#14 0x564f10f497b8 <unknown>
#15 0x564f10f5b1de <unknown>
#16 0x7f72827fbb7b <unknown>
[0m
```

- SKIPPED - test_04_teacher_validates_cd_with_options_and_errors (tests.selenium.test_home.HomePageSeleniumTests.test_04_teacher_validates_cd_with_options_and_errors)

```text
Missing prerequisite state: approved_theme_id
```

- SKIPPED - test_05_da_validation_options_and_errors (tests.selenium.test_home.HomePageSeleniumTests.test_05_da_validation_options_and_errors)

```text
Missing prerequisite state: approved_theme_id
```

- SKIPPED - test_06_student_upload_and_auto_test (tests.selenium.test_home.HomePageSeleniumTests.test_06_student_upload_and_auto_test)

```text
Missing prerequisite state: approved_theme_id
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
  File [35m"/home/okcid/Documents/handal/tests/selenium/test_home.py"[0m, line [35m546[0m, in [35mtest_13_admin_sidebar_navigation[0m
    [31mself.wait.until[0m[1;31m([0m
    [31m~~~~~~~~~~~~~~~[0m[1;31m^[0m
        [1;31mEC.element_to_be_clickable([0m
        [1;31m^^^^^^^^^^^^^^^^^^^^^^^^^^^[0m
            [1;31m(By.XPATH, '//button[.//span[contains(text(),"Staging")]]')[0m
            [1;31m^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^[0m
        [1;31m)[0m
        [1;31m^[0m
    [1;31m)[0m.click()
    [1;31m^[0m
  File [35m"/home/okcid/.pyenv/versions/3.14.3/lib/python3.14/site-packages/selenium/webdriver/support/wait.py"[0m, line [35m121[0m, in [35muntil[0m
    raise TimeoutException(message, screen, stacktrace)
[1;35mselenium.common.exceptions.TimeoutException[0m: [35mMessage: 
Stacktrace:
#0 0x564f10f5c79a <unknown>
#1 0x564f10958215 <unknown>
#2 0x564f109aaf06 <unknown>
#3 0x564f109ab141 <unknown>
#4 0x564f109f6634 <unknown>
#5 0x564f109f37d0 <unknown>
#6 0x564f1099e55f <unknown>
#7 0x564f1099f321 <unknown>
#8 0x564f10f2006b <unknown>
#9 0x564f10f2301d <unknown>
#10 0x564f10f0c718 <unknown>
#11 0x564f10f23bb0 <unknown>
#12 0x564f10ef3150 <unknown>
#13 0x564f10f495e8 <unknown>
#14 0x564f10f497b8 <unknown>
#15 0x564f10f5b1de <unknown>
#16 0x7f72827fbb7b <unknown>
[0m
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
