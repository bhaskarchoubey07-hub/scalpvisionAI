export type CalendarEvent = {
  id: string;
  title: string;
  date: string;
  importance: "high" | "medium" | "low";
  category: "macro" | "earnings" | "dividend" | "ipo";
  expected?: string;
  actual?: string;
  previous?: string;
  currency?: string;
};

export async function fetchEconomicCalendar(): Promise<CalendarEvent[]> {
  const now = new Date();
  
  const formatDate = (daysFromNow: number) => {
    const d = new Date(now);
    d.setDate(now.getDate() + daysFromNow);
    return d.toISOString().split("T")[0];
  };

  return [
    {
      id: "macro-1",
      title: "US FOMC Interest Rate Decision",
      date: formatDate(1),
      importance: "high",
      category: "macro",
      expected: "5.25%",
      previous: "5.25%",
      currency: "USD"
    },
    {
      id: "macro-2",
      title: "US Consumer Price Index (CPI) MoM",
      date: formatDate(3),
      importance: "high",
      category: "macro",
      expected: "0.2%",
      previous: "0.1%",
      currency: "USD"
    },
    {
      id: "macro-3",
      title: "RBI Monetary Policy Committee Meeting",
      date: formatDate(5),
      importance: "high",
      category: "macro",
      expected: "6.50%",
      previous: "6.50%",
      currency: "INR"
    },
    {
      id: "earnings-1",
      title: "Apple Inc. (AAPL) Q3 Earnings Release",
      date: formatDate(2),
      importance: "high",
      category: "earnings",
      expected: "$1.40 EPS"
    },
    {
      id: "earnings-2",
      title: "NVIDIA Corp. (NVDA) Q2 Earnings Release",
      date: formatDate(6),
      importance: "high",
      category: "earnings",
      expected: "$0.64 EPS"
    },
    {
      id: "dividend-1",
      title: "Microsoft Corp. (MSFT) Ex-Dividend Date",
      date: formatDate(4),
      importance: "medium",
      category: "dividend",
      expected: "$0.75 per share"
    },
    {
      id: "ipo-1",
      title: "Neuralink Corp. IPO Listing",
      date: formatDate(8),
      importance: "medium",
      category: "ipo",
      expected: "$45.00 offer price"
    }
  ];
}
