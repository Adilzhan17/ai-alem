export interface EstateResult {
    id: number;
    title: string;
    price: number;
    area: number;
    rooms: number;
    district: string;
    image_url: string;
    match_score: number;
}

export interface EstimateItem {
    item: string;
    quantity: number;
    unit: string;
    price: number;
    total: number;
}

export interface EstimateResult {
    items: EstimateItem[];
    grand_total: number;
    tax: number;
}
