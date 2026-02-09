import { getPool } from "./pool";

// ========== VENDOR ANALYTICS ==========

export type VendorStats = {
  totalEarnings: number;
  totalBookings: number;
  avgRating: number;
  thisMonthEarnings: number;
  earningsTrend: number;
  bookingsTrend: number;
};

export type MonthlyEarnings = {
  month: string;
  earnings: number;
};

export type RatingDistribution = {
  stars: number;
  count: number;
  percentage: number;
};

export async function getVendorStats(vendorId: number): Promise<VendorStats> {
  const pool = getPool();

  // Total earnings and bookings
  const totalsResult = await pool.query<{ total_earnings: string | null; total_bookings: string }>(
    `
    SELECT 
      COALESCE(SUM(s.price), 0) AS total_earnings,
      COUNT(b.id) AS total_bookings
    FROM bookings b
    JOIN services s ON b.service_id = s.id
    WHERE s.vendor_id = $1
      AND b.status IN ('accepted', 'completed')
    `,
    [vendorId]
  );

  const totalEarnings = Number(totalsResult.rows[0]?.total_earnings || 0);
  const totalBookings = Number(totalsResult.rows[0]?.total_bookings || 0);

  // This month earnings
  const thisMonthResult = await pool.query<{ this_month_earnings: string | null }>(
    `
    SELECT COALESCE(SUM(s.price), 0) AS this_month_earnings
    FROM bookings b
    JOIN services s ON b.service_id = s.id
    WHERE s.vendor_id = $1
      AND b.status IN ('accepted', 'completed')
      AND DATE_TRUNC('month', b.created_at) = DATE_TRUNC('month', CURRENT_DATE)
    `,
    [vendorId]
  );

  const thisMonthEarnings = Number(thisMonthResult.rows[0]?.this_month_earnings || 0);

  // Last month earnings for trend
  const lastMonthResult = await pool.query<{ last_month_earnings: string | null }>(
    `
    SELECT COALESCE(SUM(s.price), 0) AS last_month_earnings
    FROM bookings b
    JOIN services s ON b.service_id = s.id
    WHERE s.vendor_id = $1
      AND b.status IN ('accepted', 'completed')
      AND DATE_TRUNC('month', b.created_at) = DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month')
    `,
    [vendorId]
  );

  const lastMonthEarnings = Number(lastMonthResult.rows[0]?.last_month_earnings || 0);
  const earningsTrend = lastMonthEarnings > 0 ? ((thisMonthEarnings - lastMonthEarnings) / lastMonthEarnings) * 100 : 0;

  // This month bookings count
  const thisMonthBookingsResult = await pool.query<{ this_month_bookings: string }>(
    `
    SELECT COUNT(b.id) AS this_month_bookings
    FROM bookings b
    JOIN services s ON b.service_id = s.id
    WHERE s.vendor_id = $1
      AND DATE_TRUNC('month', b.created_at) = DATE_TRUNC('month', CURRENT_DATE)
    `,
    [vendorId]
  );

  const thisMonthBookings = Number(thisMonthBookingsResult.rows[0]?.this_month_bookings || 0);

  // Last month bookings for trend
  const lastMonthBookingsResult = await pool.query<{ last_month_bookings: string }>(
    `
    SELECT COUNT(b.id) AS last_month_bookings
    FROM bookings b
    JOIN services s ON b.service_id = s.id
    WHERE s.vendor_id = $1
      AND DATE_TRUNC('month', b.created_at) = DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month')
    `,
    [vendorId]
  );

  const lastMonthBookings = Number(lastMonthBookingsResult.rows[0]?.last_month_bookings || 0);
  const bookingsTrend = lastMonthBookings > 0 ? ((thisMonthBookings - lastMonthBookings) / lastMonthBookings) * 100 : 0;

  // Average rating (placeholder - reviews not yet implemented)
  const avgRating = 4.8;

  return {
    totalEarnings,
    totalBookings,
    avgRating,
    thisMonthEarnings,
    earningsTrend,
    bookingsTrend,
  };
}

export async function getVendorMonthlyEarnings(vendorId: number, months: number = 6): Promise<MonthlyEarnings[]> {
  const pool = getPool();

  const result = await pool.query<{ month: string; earnings: string }>(
    `
    SELECT 
      TO_CHAR(DATE_TRUNC('month', b.created_at), 'Mon') AS month,
      COALESCE(SUM(s.price), 0) AS earnings
    FROM bookings b
    JOIN services s ON b.service_id = s.id
    WHERE s.vendor_id = $1
      AND b.status IN ('accepted', 'completed')
      AND b.created_at >= CURRENT_DATE - INTERVAL '1 month' * $2
    GROUP BY DATE_TRUNC('month', b.created_at)
    ORDER BY DATE_TRUNC('month', b.created_at) ASC
    `,
    [vendorId, months]
  );

  return result.rows.map((row) => ({
    month: row.month,
    earnings: Number(row.earnings),
  }));
}

export async function getVendorRatingDistribution(vendorId: number): Promise<RatingDistribution[]> {
  // Placeholder - reviews module not yet implemented
  // Return mock distribution for now
  const total = 258;
  return [
    { stars: 5, count: 186, percentage: Math.round((186 / total) * 100) },
    { stars: 4, count: 45, percentage: Math.round((45 / total) * 100) },
    { stars: 3, count: 18, percentage: Math.round((18 / total) * 100) },
    { stars: 2, count: 7, percentage: Math.round((7 / total) * 100) },
    { stars: 1, count: 2, percentage: Math.round((2 / total) * 100) },
  ];
}

// ========== ADMIN ANALYTICS ==========

export type AdminStats = {
  totalUsers: number;
  totalVendors: number;
  totalBookings: number;
  totalRevenue: number;
  usersTrend: number;
  vendorsTrend: number;
  bookingsTrend: number;
  revenueTrend: number;
};

export type MonthlyGrowth = {
  month: string;
  users: number;
  vendors: number;
};

export type MonthlyBookings = {
  month: string;
  bookings: number;
};

export async function getAdminStats(): Promise<AdminStats> {
  const pool = getPool();

  // Total users (customers)
  const usersResult = await pool.query<{ total_users: string }>(
    `SELECT COUNT(*) AS total_users FROM users WHERE role = 'customer'`
  );
  const totalUsers = Number(usersResult.rows[0]?.total_users || 0);

  // Total vendors
  const vendorsResult = await pool.query<{ total_vendors: string }>(
    `SELECT COUNT(*) AS total_vendors FROM users WHERE role = 'vendor'`
  );
  const totalVendors = Number(vendorsResult.rows[0]?.total_vendors || 0);

  // Total bookings
  const bookingsResult = await pool.query<{ total_bookings: string }>(
    `SELECT COUNT(*) AS total_bookings FROM bookings`
  );
  const totalBookings = Number(bookingsResult.rows[0]?.total_bookings || 0);

  // Total revenue
  const revenueResult = await pool.query<{ total_revenue: string | null }>(
    `
    SELECT COALESCE(SUM(s.price), 0) AS total_revenue
    FROM bookings b
    JOIN services s ON b.service_id = s.id
    WHERE b.status IN ('accepted', 'completed')
    `
  );
  const totalRevenue = Number(revenueResult.rows[0]?.total_revenue || 0);

  // This month metrics
  const thisMonthUsersResult = await pool.query<{ this_month_users: string }>(
    `
    SELECT COUNT(*) AS this_month_users 
    FROM users 
    WHERE role = 'customer' 
      AND DATE_TRUNC('month', created_at) = DATE_TRUNC('month', CURRENT_DATE)
    `
  );
  const thisMonthUsers = Number(thisMonthUsersResult.rows[0]?.this_month_users || 0);

  const lastMonthUsersResult = await pool.query<{ last_month_users: string }>(
    `
    SELECT COUNT(*) AS last_month_users 
    FROM users 
    WHERE role = 'customer' 
      AND DATE_TRUNC('month', created_at) = DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month')
    `
  );
  const lastMonthUsers = Number(lastMonthUsersResult.rows[0]?.last_month_users || 0);
  const usersTrend = lastMonthUsers > 0 ? ((thisMonthUsers - lastMonthUsers) / lastMonthUsers) * 100 : 0;

  // Vendors trend
  const thisMonthVendorsResult = await pool.query<{ this_month_vendors: string }>(
    `
    SELECT COUNT(*) AS this_month_vendors 
    FROM users 
    WHERE role = 'vendor' 
      AND DATE_TRUNC('month', created_at) = DATE_TRUNC('month', CURRENT_DATE)
    `
  );
  const thisMonthVendors = Number(thisMonthVendorsResult.rows[0]?.this_month_vendors || 0);

  const lastMonthVendorsResult = await pool.query<{ last_month_vendors: string }>(
    `
    SELECT COUNT(*) AS last_month_vendors 
    FROM users 
    WHERE role = 'vendor' 
      AND DATE_TRUNC('month', created_at) = DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month')
    `
  );
  const lastMonthVendors = Number(lastMonthVendorsResult.rows[0]?.last_month_vendors || 0);
  const vendorsTrend = lastMonthVendors > 0 ? ((thisMonthVendors - lastMonthVendors) / lastMonthVendors) * 100 : 0;

  // Bookings trend
  const thisMonthBookingsResult = await pool.query<{ this_month_bookings: string }>(
    `
    SELECT COUNT(*) AS this_month_bookings 
    FROM bookings 
    WHERE DATE_TRUNC('month', created_at) = DATE_TRUNC('month', CURRENT_DATE)
    `
  );
  const thisMonthBookings = Number(thisMonthBookingsResult.rows[0]?.this_month_bookings || 0);

  const lastMonthBookingsResult = await pool.query<{ last_month_bookings: string }>(
    `
    SELECT COUNT(*) AS last_month_bookings 
    FROM bookings 
    WHERE DATE_TRUNC('month', created_at) = DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month')
    `
  );
  const lastMonthBookings = Number(lastMonthBookingsResult.rows[0]?.last_month_bookings || 0);
  const bookingsTrend = lastMonthBookings > 0 ? ((thisMonthBookings - lastMonthBookings) / lastMonthBookings) * 100 : 0;

  // Revenue trend
  const thisMonthRevenueResult = await pool.query<{ this_month_revenue: string | null }>(
    `
    SELECT COALESCE(SUM(s.price), 0) AS this_month_revenue
    FROM bookings b
    JOIN services s ON b.service_id = s.id
    WHERE b.status IN ('accepted', 'completed')
      AND DATE_TRUNC('month', b.created_at) = DATE_TRUNC('month', CURRENT_DATE)
    `
  );
  const thisMonthRevenue = Number(thisMonthRevenueResult.rows[0]?.this_month_revenue || 0);

  const lastMonthRevenueResult = await pool.query<{ last_month_revenue: string | null }>(
    `
    SELECT COALESCE(SUM(s.price), 0) AS last_month_revenue
    FROM bookings b
    JOIN services s ON b.service_id = s.id
    WHERE b.status IN ('accepted', 'completed')
      AND DATE_TRUNC('month', b.created_at) = DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month')
    `
  );
  const lastMonthRevenue = Number(lastMonthRevenueResult.rows[0]?.last_month_revenue || 0);
  const revenueTrend = lastMonthRevenue > 0 ? ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 : 0;

  return {
    totalUsers,
    totalVendors,
    totalBookings,
    totalRevenue,
    usersTrend,
    vendorsTrend,
    bookingsTrend,
    revenueTrend,
  };
}

export async function getAdminUserGrowth(months: number = 6): Promise<MonthlyGrowth[]> {
  const pool = getPool();

  const result = await pool.query<{ month: string; users: string; vendors: string }>(
    `
    SELECT 
      TO_CHAR(DATE_TRUNC('month', created_at), 'Mon') AS month,
      COUNT(*) FILTER (WHERE role = 'customer') AS users,
      COUNT(*) FILTER (WHERE role = 'vendor') AS vendors
    FROM users
    WHERE created_at >= CURRENT_DATE - INTERVAL '1 month' * $1
    GROUP BY DATE_TRUNC('month', created_at)
    ORDER BY DATE_TRUNC('month', created_at) ASC
    `,
    [months]
  );

  return result.rows.map((row) => ({
    month: row.month,
    users: Number(row.users),
    vendors: Number(row.vendors),
  }));
}

export async function getAdminBookingsTrend(months: number = 6): Promise<MonthlyBookings[]> {
  const pool = getPool();

  const result = await pool.query<{ month: string; bookings: string }>(
    `
    SELECT 
      TO_CHAR(DATE_TRUNC('month', created_at), 'Mon') AS month,
      COUNT(*) AS bookings
    FROM bookings
    WHERE created_at >= CURRENT_DATE - INTERVAL '1 month' * $1
    GROUP BY DATE_TRUNC('month', created_at)
    ORDER BY DATE_TRUNC('month', created_at) ASC
    `,
    [months]
  );

  return result.rows.map((row) => ({
    month: row.month,
    bookings: Number(row.bookings),
  }));
}

// ========== CUSTOMER ANALYTICS ==========

export type CustomerStats = {
  totalBookings: number;
  upcomingBookings: number;
  completedBookings: number;
  totalSpent: number;
  bookingsTrend: number;
  spentTrend: number;
};

export async function getCustomerStats(customerId: number): Promise<CustomerStats> {
  const pool = getPool();

  // Total bookings
  const totalResult = await pool.query<{ total_bookings: string }>(
    `SELECT COUNT(*) AS total_bookings FROM bookings WHERE customer_id = $1`,
    [customerId]
  );
  const totalBookings = Number(totalResult.rows[0]?.total_bookings || 0);

  // Upcoming bookings (accepted, slot date in future)
  const upcomingResult = await pool.query<{ upcoming_bookings: string }>(
    `
    SELECT COUNT(*) AS upcoming_bookings
    FROM bookings b
    JOIN availability_slots s ON b.slot_id = s.id
    WHERE b.customer_id = $1
      AND b.status = 'accepted'
      AND s.slot_date >= CURRENT_DATE
    `,
    [customerId]
  );
  const upcomingBookings = Number(upcomingResult.rows[0]?.upcoming_bookings || 0);

  // Completed bookings
  const completedResult = await pool.query<{ completed_bookings: string }>(
    `
    SELECT COUNT(*) AS completed_bookings
    FROM bookings
    WHERE customer_id = $1 AND status = 'completed'
    `,
    [customerId]
  );
  const completedBookings = Number(completedResult.rows[0]?.completed_bookings || 0);

  // Total spent
  const spentResult = await pool.query<{ total_spent: string | null }>(
    `
    SELECT COALESCE(SUM(s.price), 0) AS total_spent
    FROM bookings b
    JOIN services s ON b.service_id = s.id
    WHERE b.customer_id = $1
      AND b.status IN ('accepted', 'completed')
    `,
    [customerId]
  );
  const totalSpent = Number(spentResult.rows[0]?.total_spent || 0);

  // This month bookings
  const thisMonthBookingsResult = await pool.query<{ this_month_bookings: string }>(
    `
    SELECT COUNT(*) AS this_month_bookings
    FROM bookings
    WHERE customer_id = $1
      AND DATE_TRUNC('month', created_at) = DATE_TRUNC('month', CURRENT_DATE)
    `,
    [customerId]
  );
  const thisMonthBookings = Number(thisMonthBookingsResult.rows[0]?.this_month_bookings || 0);

  // Last month bookings
  const lastMonthBookingsResult = await pool.query<{ last_month_bookings: string }>(
    `
    SELECT COUNT(*) AS last_month_bookings
    FROM bookings
    WHERE customer_id = $1
      AND DATE_TRUNC('month', created_at) = DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month')
    `,
    [customerId]
  );
  const lastMonthBookings = Number(lastMonthBookingsResult.rows[0]?.last_month_bookings || 0);
  const bookingsTrend = lastMonthBookings > 0 ? ((thisMonthBookings - lastMonthBookings) / lastMonthBookings) * 100 : 0;

  // This month spent
  const thisMonthSpentResult = await pool.query<{ this_month_spent: string | null }>(
    `
    SELECT COALESCE(SUM(s.price), 0) AS this_month_spent
    FROM bookings b
    JOIN services s ON b.service_id = s.id
    WHERE b.customer_id = $1
      AND b.status IN ('accepted', 'completed')
      AND DATE_TRUNC('month', b.created_at) = DATE_TRUNC('month', CURRENT_DATE)
    `,
    [customerId]
  );
  const thisMonthSpent = Number(thisMonthSpentResult.rows[0]?.this_month_spent || 0);

  // Last month spent
  const lastMonthSpentResult = await pool.query<{ last_month_spent: string | null }>(
    `
    SELECT COALESCE(SUM(s.price), 0) AS last_month_spent
    FROM bookings b
    JOIN services s ON b.service_id = s.id
    WHERE b.customer_id = $1
      AND b.status IN ('accepted', 'completed')
      AND DATE_TRUNC('month', b.created_at) = DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month')
    `,
    [customerId]
  );
  const lastMonthSpent = Number(lastMonthSpentResult.rows[0]?.last_month_spent || 0);
  const spentTrend = lastMonthSpent > 0 ? ((thisMonthSpent - lastMonthSpent) / lastMonthSpent) * 100 : 0;

  return {
    totalBookings,
    upcomingBookings,
    completedBookings,
    totalSpent,
    bookingsTrend,
    spentTrend,
  };
}
