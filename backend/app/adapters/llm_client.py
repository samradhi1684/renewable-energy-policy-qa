import requests


class LLMClient:

    def __init__(
        self,
        model: str = "qwen-rag",
        host: str = "http://10.100.71.36:8000",
        api_key: str = "devansh-qwen-test-69"
    ):
        self.model = model
        self.host = host
        self.api_key = api_key

    def generate(
        self,
        prompt: str,
        temperature: float = 0.1,
        max_tokens: int = 100
    ) -> str:

        response = requests.post(
            f"{self.host}/v1/chat/completions",
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {self.api_key}"
            },
            json={
                "model": self.model,
                "messages": [
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                "temperature": temperature,
                "max_tokens": max_tokens
            },
            timeout=300
        )

        response.raise_for_status()

        data = response.json()

        # OpenAI-style response parsing
        return data["choices"][0]["message"]["content"].strip()