export interface SalesTotals {
  readonly approvedOrders: number;
  readonly revenueCop: number;
  readonly averageTicketCop: number;
}

export interface SalesSummary {
  readonly last30Days: SalesTotals;
  readonly allTime: SalesTotals;
  /** Pedidos pagados que aún no se han enviado. */
  readonly pendingToShip: number;
  readonly topProducts: readonly { readonly name: string; readonly units: number }[];
  /** Un punto por día (hora de Colombia), del más antiguo a hoy. */
  readonly dailyRevenue: readonly { readonly date: string; readonly revenueCop: number }[];
}

export interface AdminSummary {
  readonly customers: { readonly total: number; readonly last30Days: number };
  readonly products: { readonly total: number; readonly published: number };
  readonly sales: SalesSummary;
}
