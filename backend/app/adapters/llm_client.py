import requests


class LLMClient:

    def __init__(
        self,
        model: str = "qwen2.5:14b",
        host: str = "http://localhost:11434"
    ):
        self.model = model
        self.host = host

    def generate(
        self,
        prompt: str,
        temperature: float = 0.1
    ) -> str:

        response = requests.post(
            f"{self.host}/api/generate",
            json={
                "model": self.model,
                "prompt": prompt,
                "stream": False,
                "options": {
                    "temperature": temperature
                }
            },
            timeout=300
        )

        response.raise_for_status()

        data = response.json()

        return data["response"].strip()