from typing import List, Dict

class BOQService:
    def __init__(self):
        # Базовые расценки (MVP Mock) в тенге за м2 или ед.изм
        self.rates = {
            "wall_plastering": 2500, # Штукатурка
            "painting": 1800, # Покраска
            "flooring_laminate": 4500, # Ламинат
            "electrical_point": 5000, # Точка электрики
            "plumbing_point": 12000 # Точка сантехники
        }

    def calculate_estimate(self, plan_data: Dict) -> Dict:
        """
        Принимает геометрию из CV и возвращает смету.
        """
        area = plan_data.get("total_area", 0)
        
        # Упрощенный расчет: 
        # Площадь стен ~= Площадь пола * 3 (для стандартных потолков)
        wall_area = area * 3 
        
        items = [
            {
                "item": "Штукатурка стен",
                "quantity": wall_area,
                "unit": "m2",
                "price": self.rates["wall_plastering"],
                "total": wall_area * self.rates["wall_plastering"]
            },
            {
                "item": "Укладка ламината",
                "quantity": area,
                "unit": "m2",
                "price": self.rates["flooring_laminate"],
                "total": area * self.rates["flooring_laminate"]
            },
            {
                "item": "Точки электричества (approx)",
                "quantity": round(area / 4),
                "unit": "шт",
                "price": self.rates["electrical_point"],
                "total": round(area / 4) * self.rates["electrical_point"]
            }
        ]
        
        grand_total = sum(item["total"] for item in items)
        
        return {
            "items": items,
            "grand_total": grand_total,
            "tax_estimate": grand_total * 0.12 # НДС 12% РК
        }

boq_service = BOQService()
