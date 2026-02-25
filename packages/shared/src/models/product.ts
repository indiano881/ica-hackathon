export interface Product {
  type: "product";
  ean: string;
  name: string;
  brand: string;
  category: string;
  price: number;
  currency: string;
  vat_rate: number;
  image_url: string;
  store_id: string;
  in_stock: boolean;
  updated_at: string;
}
