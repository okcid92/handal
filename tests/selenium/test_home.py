import os
import re
import time
import unittest

from selenium.webdriver.common.by import By
from selenium.common.exceptions import TimeoutException
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import WebDriverWait

from tests.selenium.driver import create_driver


BASE_URL = os.environ.get("BASE_URL", "http://localhost:3000")
DEMO_STUDENT_INE = "N01331820231"
DEMO_PASSWORD = "mon926732"
DEMO_TEACHER_EMAIL = "teacher@handal.local"
DEMO_DA_EMAIL = "da@handal.local"
DEMO_ADMIN_EMAIL = "admin@handal.local"


class HomePageSeleniumTests(unittest.TestCase):
    approved_theme_id = None
    rejected_theme_id = None
    document_id = None
    report_id = None

    @classmethod
    def setUpClass(cls):
        cls.driver = create_driver()
        cls.wait = WebDriverWait(cls.driver, 20)

    @classmethod
    def tearDownClass(cls):
        if getattr(cls, "driver", None):
            cls.driver.quit()

    def panel(self, title: str):
        return self.wait.until(
            EC.presence_of_element_located(
                (
                    By.XPATH,
                    f'//section[.//h2[normalize-space()="{title}"]]',
                )
            )
        )

    def panel_input(self, panel_title: str, label_text: str):
        return self.wait.until(
            EC.presence_of_element_located(
                (
                    By.XPATH,
                    f'//section[.//h2[normalize-space()="{panel_title}"]]//label[.//div[normalize-space()="{label_text}"]]/input',
                )
            )
        )

    def panel_textarea(self, panel_title: str, label_text: str):
        return self.wait.until(
            EC.presence_of_element_located(
                (
                    By.XPATH,
                    f'//section[.//h2[normalize-space()="{panel_title}"]]//label[.//div[normalize-space()="{label_text}"]]/textarea',
                )
            )
        )

    def panel_select(self, panel_title: str):
        return self.wait.until(
            EC.presence_of_element_located(
                (
                    By.XPATH,
                    f'//section[.//h2[normalize-space()="{panel_title}"]]//select',
                )
            )
        )

    def click_panel_button(self, panel_title: str, label: str):
        button = self.wait.until(
            EC.element_to_be_clickable(
                (
                    By.XPATH,
                    f'//section[.//h2[normalize-space()="{panel_title}"]]//button[normalize-space()="{label}"]',
                )
            )
        )
        button.click()

    def wait_for_text(self, text_fragment: str):
        try:
            self.wait.until(
                EC.text_to_be_present_in_element((By.TAG_NAME, "body"), text_fragment)
            )
        except TimeoutException as error:
            body_text = self.driver.find_element(By.TAG_NAME, "body").text
            raise AssertionError(
                f"Text fragment not found: {text_fragment}. body_excerpt={body_text[:1200]}"
            ) from error

    def wait_for_any_text(self, text_fragments: list[str]):
        if not text_fragments:
            raise ValueError("text_fragments must not be empty")

        def has_one_fragment(driver):
            body_text = driver.find_element(By.TAG_NAME, "body").text
            return any(fragment in body_text for fragment in text_fragments)

        try:
            self.wait.until(has_one_fragment)
        except TimeoutException as error:
            body_text = self.driver.find_element(By.TAG_NAME, "body").text
            raise AssertionError(
                "Expected one of error fragments was not found. "
                f"fragments={text_fragments}. "
                f"body_excerpt={body_text[:1200]}"
            ) from error

    def require_state(self, value: str | None, name: str):
        if value is None:
            self.skipTest(f"Missing prerequisite state: {name}")

    def login(self, *, mode: str, identifier: str, password: str, expected_path: str):
        self.driver.get(BASE_URL)

        mode_button_label = "Etudiant" if mode == "student" else "Personnel"
        self.wait.until(
            EC.element_to_be_clickable(
                (
                    By.XPATH,
                    f'//button[normalize-space()="{mode_button_label}"]',
                )
            )
        ).click()

        login_input = self.wait.until(
            EC.presence_of_element_located((By.CSS_SELECTOR, 'input[autocomplete="username"]'))
        )
        password_input = self.driver.find_element(
            By.CSS_SELECTOR,
            'input[autocomplete="current-password"]',
        )

        login_input.clear()
        login_input.send_keys(identifier)
        password_input.clear()
        password_input.send_keys(password)

        self.driver.find_element(By.CSS_SELECTOR, 'button[type="submit"]').click()
        self.wait.until(EC.url_contains(expected_path))

    def test_01_home_page_shows_login_panel(self):
        self.driver.get(BASE_URL)

        title = self.wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, "h1")))
        self.assertRegex(title.text, r"Handal")

        submit_button = self.wait.until(
            EC.presence_of_element_located((By.CSS_SELECTOR, 'button[type="submit"]'))
        )
        self.assertEqual(submit_button.text, "Se connecter")

    def test_02_invalid_login_shows_error(self):
        self.driver.get(BASE_URL)

        self.wait.until(
            EC.element_to_be_clickable((By.XPATH, '//button[normalize-space()="Etudiant"]'))
        ).click()

        login_input = self.wait.until(
            EC.presence_of_element_located((By.CSS_SELECTOR, 'input[autocomplete="username"]'))
        )
        password_input = self.driver.find_element(
            By.CSS_SELECTOR,
            'input[autocomplete="current-password"]',
        )

        login_input.clear()
        login_input.send_keys(DEMO_STUDENT_INE)
        password_input.clear()
        password_input.send_keys("wrong-password")

        self.driver.find_element(By.CSS_SELECTOR, 'button[type="submit"]').click()
        self.wait_for_text("Invalid credentials")

    def test_03_student_theme_submission_success_and_errors(self):
        self.login(
            mode="student",
            identifier=DEMO_STUDENT_INE,
            password=DEMO_PASSWORD,
            expected_path="/student",
        )

        title_input = self.panel_input("Proposer un thème", "Titre")
        description_input = self.panel_textarea("Proposer un thème", "Description")

        title_input.clear()
        title_input.send_keys("Court")
        description_input.clear()
        description_input.send_keys("Description invalide pour test")
        self.click_panel_button("Proposer un thème", "Créer le thème")
        self.wait_for_any_text(
            [
                "Theme title must contain at least 8 characters",
                "Too small:",
                "expected string to have >=8 characters",
                "Invalid input",
            ]
        )

        unique_suffix = str(int(time.time() * 1000))

        title_input = self.panel_input("Proposer un thème", "Titre")
        description_input = self.panel_textarea("Proposer un thème", "Description")
        title_input.clear()
        title_input.send_keys(f"Workflow Approve {unique_suffix}")
        description_input.clear()
        description_input.send_keys("Theme a approuver dans le workflow Selenium")
        self.click_panel_button("Proposer un thème", "Créer le thème")
        self.wait_for_text("Theme créé:")

        body = self.driver.find_element(By.TAG_NAME, "body").text
        match_approved = re.search(r"Theme créé: (\d+) \(PENDING\)", body)
        self.assertIsNotNone(match_approved)
        self.__class__.approved_theme_id = match_approved.group(1)

        title_input = self.panel_input("Proposer un thème", "Titre")
        description_input = self.panel_textarea("Proposer un thème", "Description")
        title_input.clear()
        title_input.send_keys(f"Workflow Reject {unique_suffix}")
        description_input.clear()
        description_input.send_keys("Theme a rejeter dans le workflow Selenium")
        self.click_panel_button("Proposer un thème", "Créer le thème")
        self.wait_for_text("Theme créé:")

        body = self.driver.find_element(By.TAG_NAME, "body").text
        matches = re.findall(r"Theme créé: (\d+) \(PENDING\)", body)
        self.assertGreaterEqual(len(matches), 1)
        self.__class__.rejected_theme_id = matches[-1]

        doc_theme = self.panel_input("Dépôt du mémoire", "Theme ID")
        doc_name = self.panel_input("Dépôt du mémoire", "Nom du fichier")
        doc_checksum = self.panel_input("Dépôt du mémoire", "Checksum")

        doc_theme.clear()
        doc_theme.send_keys(self.__class__.rejected_theme_id)
        doc_name.clear()
        doc_name.send_keys("memoire-non-valide.pdf")
        doc_checksum.clear()
        doc_checksum.send_keys("sha256:reject")
        self.click_panel_button("Dépôt du mémoire", "Enregistrer le dépôt")
        self.wait_for_text("Theme must be VALIDATED_DA before final upload")

    def test_04_teacher_validates_cd_with_options_and_errors(self):
        self.require_state(self.__class__.approved_theme_id, "approved_theme_id")
        self.require_state(self.__class__.rejected_theme_id, "rejected_theme_id")

        self.login(
            mode="staff",
            identifier=DEMO_TEACHER_EMAIL,
            password=DEMO_PASSWORD,
            expected_path="/teacher",
        )

        theme_id = self.panel_input("Validation locale / Analyse", "Theme ID")
        theme_comment = self.panel_input("Validation locale / Analyse", "Commentaire")
        decision = self.panel_select("Validation locale / Analyse")

        theme_id.clear()
        theme_id.send_keys(self.__class__.rejected_theme_id)
        decision.send_keys("rejected")
        theme_comment.clear()
        theme_comment.send_keys("Rejet Selenium")
        self.click_panel_button("Validation locale / Analyse", "Valider le thème")
        self.wait_for_text("Thème mis à jour: REJECTED")

        theme_id = self.panel_input("Validation locale / Analyse", "Theme ID")
        theme_comment = self.panel_input("Validation locale / Analyse", "Commentaire")
        decision = self.panel_select("Validation locale / Analyse")

        theme_id.clear()
        theme_id.send_keys(self.__class__.approved_theme_id)
        decision.send_keys("approved")
        theme_comment.clear()
        theme_comment.send_keys("Validation CD Selenium")
        self.click_panel_button("Validation locale / Analyse", "Valider le thème")
        self.wait_for_text("Thème mis à jour: VALIDATED_CD")

        analysis_doc = self.panel_input("Validation locale / Analyse", "Document ID")
        analysis_doc.clear()
        analysis_doc.send_keys("999999")
        self.click_panel_button("Validation locale / Analyse", "Lancer l’analyse")
        self.wait_for_text("Document not found")

    def test_05_da_validation_options_and_errors(self):
        self.require_state(self.__class__.approved_theme_id, "approved_theme_id")
        self.require_state(self.__class__.rejected_theme_id, "rejected_theme_id")

        self.login(
            mode="staff",
            identifier=DEMO_DA_EMAIL,
            password=DEMO_PASSWORD,
            expected_path="/da",
        )

        theme_id = self.panel_input("Validation académique", "Theme ID")
        final_score = self.panel_input("Validation académique", "Note finale (0..20)")
        comment = self.panel_input("Validation académique", "Commentaire")
        decision = self.panel_select("Validation académique")

        theme_id.clear()
        theme_id.send_keys(self.__class__.approved_theme_id)
        decision.send_keys("approved")
        final_score.clear()
        final_score.send_keys("30")
        comment.clear()
        comment.send_keys("Score invalide")
        self.click_panel_button("Validation académique", "Valider le thème")
        self.wait_for_any_text(
            [
                "Final score must be between 0 and 20",
                "Too big:",
                "must be less than or equal to 20",
                "Invalid input",
            ]
        )

        theme_id = self.panel_input("Validation académique", "Theme ID")
        final_score = self.panel_input("Validation académique", "Note finale (0..20)")
        comment = self.panel_input("Validation académique", "Commentaire")
        decision = self.panel_select("Validation académique")

        theme_id.clear()
        theme_id.send_keys(self.__class__.rejected_theme_id)
        decision.send_keys("approved")
        final_score.clear()
        final_score.send_keys("18")
        comment.clear()
        comment.send_keys("Theme non valide CD")
        self.click_panel_button("Validation académique", "Valider le thème")
        self.wait_for_text("Theme must be VALIDATED_CD before this action")

        theme_id = self.panel_input("Validation académique", "Theme ID")
        final_score = self.panel_input("Validation académique", "Note finale (0..20)")
        comment = self.panel_input("Validation académique", "Commentaire")
        decision = self.panel_select("Validation académique")

        theme_id.clear()
        theme_id.send_keys(self.__class__.approved_theme_id)
        decision.send_keys("approved")
        final_score.clear()
        final_score.send_keys("18")
        comment.clear()
        comment.send_keys("Validation DA Selenium")
        self.click_panel_button("Validation académique", "Valider le thème")
        self.wait_for_text(f"Thème {self.__class__.approved_theme_id} -> VALIDATED_DA")

        report_id = self.panel_input("Délibération finale", "Report ID")
        committee = self.panel_input("Délibération finale", "Committee")
        notes = self.panel_input("Délibération finale", "Notes")
        delib_decision = self.panel_select("Délibération finale")

        report_id.clear()
        report_id.send_keys("999999")
        delib_decision.send_keys("sanction")
        committee.clear()
        committee.send_keys("Comite Selenium")
        notes.clear()
        notes.send_keys("Rapport inexistant")
        self.click_panel_button("Délibération finale", "Enregistrer")
        self.wait_for_text("Report not found")

    def test_06_student_upload_and_auto_test(self):
        self.require_state(self.__class__.approved_theme_id, "approved_theme_id")

        self.login(
            mode="student",
            identifier=DEMO_STUDENT_INE,
            password=DEMO_PASSWORD,
            expected_path="/student",
        )

        doc_theme = self.panel_input("Dépôt du mémoire", "Theme ID")
        doc_name = self.panel_input("Dépôt du mémoire", "Nom du fichier")
        doc_checksum = self.panel_input("Dépôt du mémoire", "Checksum")

        doc_theme.clear()
        doc_theme.send_keys(self.__class__.approved_theme_id)
        doc_name.clear()
        doc_name.send_keys("memoire-final-selenium.pdf")
        doc_checksum.clear()
        doc_checksum.send_keys(f"sha256:ok-{int(time.time())}")
        self.click_panel_button("Dépôt du mémoire", "Enregistrer le dépôt")
        self.wait_for_text("Document enregistré:")

        body = self.driver.find_element(By.TAG_NAME, "body").text
        match_document = re.search(r"Document enregistré: (\d+)", body)
        self.assertIsNotNone(match_document)
        self.__class__.document_id = match_document.group(1)

        auto_test_input = self.panel_input("Auto-test", "Document ID")
        auto_test_input.clear()
        auto_test_input.send_keys("999999")
        self.click_panel_button("Auto-test", "Lancer l’auto-test")
        self.wait_for_text("Document not found")

        auto_test_input = self.panel_input("Auto-test", "Document ID")
        auto_test_input.clear()
        auto_test_input.send_keys(self.__class__.document_id)
        self.click_panel_button("Auto-test", "Lancer l’auto-test")
        self.wait_for_text("Auto-test calculé")

    def test_07_teacher_analyzes_document(self):
        self.require_state(self.__class__.document_id, "document_id")

        self.login(
            mode="staff",
            identifier=DEMO_TEACHER_EMAIL,
            password=DEMO_PASSWORD,
            expected_path="/teacher",
        )

        analysis_doc = self.panel_input("Validation locale / Analyse", "Document ID")
        analysis_doc.clear()
        analysis_doc.send_keys(self.__class__.document_id)
        self.click_panel_button("Validation locale / Analyse", "Lancer l’analyse")
        self.wait_for_text("Analyse officielle enregistrée")

        body = self.driver.find_element(By.TAG_NAME, "body").text
        report_match = re.search(r"Rapport #(\d+)", body)
        self.assertIsNotNone(report_match)
        self.__class__.report_id = report_match.group(1)

    def test_08_da_creates_deliberation(self):
        self.require_state(self.__class__.report_id, "report_id")

        self.login(
            mode="staff",
            identifier=DEMO_DA_EMAIL,
            password=DEMO_PASSWORD,
            expected_path="/da",
        )

        report_id = self.panel_input("Délibération finale", "Report ID")
        committee = self.panel_input("Délibération finale", "Committee")
        notes = self.panel_input("Délibération finale", "Notes")
        delib_decision = self.panel_select("Délibération finale")

        report_id.clear()
        report_id.send_keys(self.__class__.report_id)
        delib_decision.send_keys("final_validation")
        committee.clear()
        committee.send_keys("Commission Selenium")
        notes.clear()
        notes.send_keys("Validation finale OK")
        self.click_panel_button("Délibération finale", "Enregistrer")
        self.wait_for_text("Délibération enregistrée: FINAL_VALIDATION")

    def test_09_other_role_logins_work(self):
        self.login(
            mode="staff",
            identifier=DEMO_ADMIN_EMAIL,
            password=DEMO_PASSWORD,
            expected_path="/admin",
        )
        self.wait_for_text("Supervision globale")

    def test_10_logout_redirects_to_home(self):
        self.login(
            mode="student",
            identifier=DEMO_STUDENT_INE,
            password=DEMO_PASSWORD,
            expected_path="/student",
        )
        logout_btn = self.wait.until(
            EC.element_to_be_clickable(
                (By.XPATH, '//button[normalize-space()="Déconnexion"]')
            )
        )
        logout_btn.click()
        self.wait.until(EC.url_to_be(BASE_URL + "/"))
        self.wait.until(
            EC.presence_of_element_located((By.CSS_SELECTOR, 'button[type="submit"]'))
        )

    def test_11_teacher_sidebar_navigation(self):
        self.login(
            mode="staff",
            identifier=DEMO_TEACHER_EMAIL,
            password=DEMO_PASSWORD,
            expected_path="/teacher",
        )
        # Tableau de bord est actif par défaut
        self.wait_for_text("Tableau de Bord")

        # Naviguer vers Thèmes à Valider
        self.wait.until(
            EC.element_to_be_clickable(
                (By.XPATH, '//button[.//span[contains(text(),"Thèmes")]]')
            )
        ).click()
        self.wait_for_text("Thèmes à Valider")

        # Naviguer vers Rapports d'Analyse
        self.wait.until(
            EC.element_to_be_clickable(
                (By.XPATH, '//button[.//span[contains(text(),"Rapports")]]')
            )
        ).click()
        self.wait_for_text("Rapports d'Analyse")

    def test_12_da_sidebar_navigation(self):
        self.login(
            mode="staff",
            identifier=DEMO_DA_EMAIL,
            password=DEMO_PASSWORD,
            expected_path="/da",
        )
        self.wait_for_text("Tableau de bord")

        # Naviguer vers Rapports finaux
        self.wait.until(
            EC.element_to_be_clickable(
                (By.XPATH, '//button[.//span[contains(text(),"Rapports")]]')
            )
        ).click()
        self.wait_for_text("Rapports finaux")

    def test_13_admin_sidebar_navigation(self):
        self.login(
            mode="staff",
            identifier=DEMO_ADMIN_EMAIL,
            password=DEMO_PASSWORD,
            expected_path="/admin",
        )
        self.wait_for_text("Supervision globale")

        # Naviguer vers Documents de référence
        self.wait.until(
            EC.element_to_be_clickable(
                (By.XPATH, '//button[.//span[contains(text(),"Documents")]]')
            )
        ).click()
        self.wait_for_text("Documents de référence")

        # Naviguer vers Zone de staging
        self.wait.until(
            EC.element_to_be_clickable(
                (By.XPATH, '//button[.//span[contains(text(),"Staging")]]')
            )
        ).click()
        self.wait_for_text("Zone de staging")

    def test_14_student_verdict_rewrite_flow(self):
        """Vérifie que la vue réécriture s'affiche si une délibération REWRITE_REQUIRED existe."""
        self.require_state(self.__class__.report_id, "report_id")

        # Créer une délibération rewrite via DA
        self.login(
            mode="staff",
            identifier=DEMO_DA_EMAIL,
            password=DEMO_PASSWORD,
            expected_path="/da",
        )
        report_id_input = self.panel_input("Délibération finale", "Report ID")
        committee_input = self.panel_input("Délibération finale", "Committee")
        notes_input = self.panel_input("Délibération finale", "Notes")
        decision_select = self.panel_select("Délibération finale")

        report_id_input.clear()
        report_id_input.send_keys(self.__class__.report_id)
        decision_select.send_keys("rewrite_required")
        committee_input.clear()
        committee_input.send_keys("Commission Selenium Rewrite")
        notes_input.clear()
        notes_input.send_keys("Corrections demandées par Selenium")
        self.click_panel_button("Délibération finale", "Enregistrer")
        self.wait_for_text("Délibération enregistrée: REWRITE_REQUIRED")

        # L'étudiant doit voir la vue réécriture
        self.login(
            mode="student",
            identifier=DEMO_STUDENT_INE,
            password=DEMO_PASSWORD,
            expected_path="/student",
        )
        self.wait_for_any_text(["Réécriture requise", "Déposer une nouvelle version"])

    def test_15_login_mode_toggle(self):
        """Vérifie que le toggle Etudiant/Personnel change le placeholder du champ login."""
        self.driver.get(BASE_URL)

        # Mode Etudiant par défaut — placeholder INE
        login_input = self.wait.until(
            EC.presence_of_element_located((By.CSS_SELECTOR, 'input[autocomplete="username"]'))
        )
        placeholder = login_input.get_attribute("placeholder")
        self.assertIn("N0", placeholder)

        # Basculer vers Personnel
        self.wait.until(
            EC.element_to_be_clickable((By.XPATH, '//button[normalize-space()="Personnel"]'))
        ).click()
        login_input = self.wait.until(
            EC.presence_of_element_located((By.CSS_SELECTOR, 'input[autocomplete="username"]'))
        )
        placeholder = login_input.get_attribute("placeholder")
        self.assertIn("handal.local", placeholder)

    def test_16_demo_account_selector_fills_form(self):
        """Vérifie que le sélecteur de comptes de démo pré-remplit les champs."""
        self.driver.get(BASE_URL)

        from selenium.webdriver.support.ui import Select
        demo_select = self.wait.until(
            EC.presence_of_element_located((By.CSS_SELECTOR, "select"))
        )
        Select(demo_select).select_by_value("teacher")

        login_input = self.driver.find_element(
            By.CSS_SELECTOR, 'input[autocomplete="username"]'
        )
        self.assertIn("handal.local", login_input.get_attribute("value"))


if __name__ == "__main__":
    unittest.main()
