import os
import json
from typing import Tuple, Dict, Any
from openai import AsyncOpenAI
from dotenv import load_dotenv

load_dotenv()

class NLPService:
    def __init__(self):
        self.client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))

    async def parse_prompt(self, prompt: str) -> Tuple[Dict[str, Any], str]:
        """
        Преобразует текстовый промпт в JSON схему через OpenAI.
        """
        system_prompt = """
        Ты — AI брокер по недвижимости в Казахстане. Твоя задача — извлечь параметры поиска из промпта пользователя.
        Верни ТОЛЬКО JSON объект с полями:
        - city: str (город, например 'Алматы', 'Астана')
        - district: list[str] (районы в Казахстане, например ['Бостандыкский', 'Есильский'])
        - budget_max: int (макс. цена в тенге)
        - rooms: list[int] (количество комнат)
        - residential_complex: str (название ЖК, если указано)
        - features: list[str] (особенности: 'евроремонт', 'рядом парк' и т.д.)
        - clarification_question: str (если параметры неясны или город не указан, задай короткий вопрос на языке пользователя)

        Важно: Если пользователь пишет на казахском, ответь на казахском. Если на русском - на русском.
        """
        
        try:
            response = await self.client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": prompt}
                ],
                response_format={"type": "json_object"}
            )
            
            result = json.loads(response.choices[0].message.content)
            clarification = result.pop("clarification_question", None)
            
            return result, clarification
        except Exception as e:
            print(f"Error calling OpenAI: {e}")
            # Fallback to simple mock if API fails
            return {"city": None, "district": [], "budget_max": None, "rooms": [], "features": []}, "Извините, возникла ошибка при анализе запроса."

nlp_service = NLPService()
