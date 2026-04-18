import os
import unittest

from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import WebDriverWait

from tests.selenium.driver import create_driver


BASE_URL = os.environ.get("BASE_URL", "http://127.0.0.1:3000")
DEMO_STUDENT_INE = "N01331820231"
DEMO_PASSWORD = "mon926732"


class HomePageSeleniumTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.driver = create_driver()
        cls.wait = WebDriverWait(cls.driver, 20)

    @classmethod
    def tearDownClass(cls):
        if getattr(cls, "driver", None):
            cls.driver.quit()

    def test_home_page_shows_login_panel(self):
        self.driver.get(BASE_URL)

        title = self.wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, "h1")))
        self.assertRegex(title.text, r"Plateforme académique Next\.js")

        submit_button = self.wait.until(
            EC.presence_of_element_located((By.CSS_SELECTOR, 'button[type="submit"]'))
        )
        self.assertEqual(submit_button.text, "Se connecter")

    def test_student_login_redirects_to_student_dashboard(self):
        self.driver.get(BASE_URL)

        login_input = self.wait.until(
            EC.presence_of_element_located((By.CSS_SELECTOR, 'input[autocomplete="username"]'))
        )
        password_input = self.driver.find_element(By.CSS_SELECTOR, 'input[autocomplete="current-password"]')

        login_input.clear()
        login_input.send_keys(DEMO_STUDENT_INE)
        password_input.clear()
        password_input.send_keys(DEMO_PASSWORD)

        self.driver.find_element(By.CSS_SELECTOR, 'button[type="submit"]').click()

        self.wait.until(EC.url_contains("/student"))
        dashboard_title = self.wait.until(
            EC.presence_of_element_located((By.CSS_SELECTOR, "h1"))
        )
        self.assertRegex(dashboard_title.text, r"Espace étudiant")


if __name__ == "__main__":
    unittest.main()
