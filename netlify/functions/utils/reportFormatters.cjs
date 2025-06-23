/**
 * Report Formatters Utility
 * 
 * Utility functions for formatting financial reports in different output formats
 * including JSON, CSV, and other formats for enhanced API endpoints.
 */

/**
 * Convert array of objects to CSV format
 * @param {Array} data - Array of objects to convert
 * @param {Array} headers - Optional custom headers
 * @returns {string} CSV formatted string
 */
function arrayToCSV(data, headers = null) {
  if (!data || data.length === 0) {
    return '';
  }

  // Get headers from first object if not provided
  const csvHeaders = headers || Object.keys(data[0]);
  
  // Create CSV header row
  const headerRow = csvHeaders.map(header => `"${header}"`).join(',');
  
  // Create CSV data rows
  const dataRows = data.map(row => {
    return csvHeaders.map(header => {
      const value = row[header];
      if (value === null || value === undefined) {
        return '""';
      }
      // Escape quotes and wrap in quotes
      const stringValue = String(value).replace(/"/g, '""');
      return `"${stringValue}"`;
    }).join(',');
  });
  
  return [headerRow, ...dataRows].join('\n');
}

/**
 * Format platform profitability report for CSV export
 * @param {Object} report - Platform profitability report
 * @returns {string} CSV formatted string
 */
function formatPlatformProfitabilityCSV(report) {
  const headers = [
    'Platform ID',
    'Platform Name',
    'Current Balance',
    'Total Sales',
    'Total Quantity Sold',
    'Total Revenue',
    'Total Platform Cost',
    'Total Profit',
    'Average Profit Per Sale',
    'Average Buying Price',
    'Average Selling Price',
    'Profit Margin %',
    'Recurring Sales',
    'One-time Sales',
    'ROI %',
    'First Sale Date',
    'Last Sale Date'
  ];

  const csvData = report.platforms.map(platform => ({
    'Platform ID': platform.platformId,
    'Platform Name': platform.platformName,
    'Current Balance': platform.currentBalance.toFixed(2),
    'Total Sales': platform.totalSales,
    'Total Quantity Sold': platform.totalQuantitySold,
    'Total Revenue': platform.totalRevenue.toFixed(2),
    'Total Platform Cost': platform.totalPlatformCost.toFixed(2),
    'Total Profit': platform.totalProfit.toFixed(2),
    'Average Profit Per Sale': platform.averageProfitPerSale.toFixed(2),
    'Average Buying Price': platform.averageBuyingPrice.toFixed(2),
    'Average Selling Price': platform.averageSellingPrice.toFixed(2),
    'Profit Margin %': platform.profitMarginPercentage.toFixed(2),
    'Recurring Sales': platform.recurringSales,
    'One-time Sales': platform.oneTimeSales,
    'ROI %': platform.roi.toFixed(2),
    'First Sale Date': platform.firstSaleDate || '',
    'Last Sale Date': platform.lastSaleDate || ''
  }));

  return arrayToCSV(csvData, headers);
}

/**
 * Format credit utilization report for CSV export
 * @param {Object} report - Credit utilization report
 * @returns {string} CSV formatted string
 */
function formatCreditUtilizationCSV(report) {
  const headers = [
    'Platform ID',
    'Platform Name',
    'Current Balance',
    'Total Credits Added',
    'Total Credits Used',
    'Net Credit Flow',
    'Credit Add Transactions',
    'Credit Use Transactions',
    'Sales Transactions',
    'Average Credit Addition',
    'Average Credit Usage',
    'Utilization Rate %',
    'Balance to Usage Ratio',
    'First Transaction Date',
    'Last Transaction Date'
  ];

  const csvData = report.platforms.map(platform => ({
    'Platform ID': platform.platformId,
    'Platform Name': platform.platformName,
    'Current Balance': platform.currentBalance.toFixed(2),
    'Total Credits Added': platform.totalCreditsAdded.toFixed(2),
    'Total Credits Used': platform.totalCreditsUsed.toFixed(2),
    'Net Credit Flow': platform.netCreditFlow.toFixed(2),
    'Credit Add Transactions': platform.creditAddTransactions,
    'Credit Use Transactions': platform.creditUseTransactions,
    'Sales Transactions': platform.salesTransactions,
    'Average Credit Addition': platform.averageCreditAddition.toFixed(2),
    'Average Credit Usage': platform.averageCreditUsage.toFixed(2),
    'Utilization Rate %': platform.utilizationRate.toFixed(2),
    'Balance to Usage Ratio': platform.balanceToUsageRatio.toFixed(2),
    'First Transaction Date': platform.firstTransactionDate || '',
    'Last Transaction Date': platform.lastTransactionDate || ''
  }));

  return arrayToCSV(csvData, headers);
}

/**
 * Format sales profit report for CSV export
 * @param {Object} report - Sales profit report
 * @returns {string} CSV formatted string
 */
function formatSalesProfitCSV(report) {
  const headers = [
    'Group ID',
    'Group Name',
    'Group Type',
    'Total Sales',
    'Total Quantity',
    'Total Revenue',
    'Total Cost',
    'Total Profit',
    'Average Profit Per Sale',
    'Average Selling Price',
    'Average Buying Price',
    'Profit Margin %',
    'Recurring Sales',
    'One-time Sales',
    'Paid Sales',
    'Pending Sales',
    'ROI %',
    'First Sale Date',
    'Last Sale Date'
  ];

  const csvData = report.groups.map(group => ({
    'Group ID': group.groupId,
    'Group Name': group.groupName,
    'Group Type': group.groupType,
    'Total Sales': group.totalSales,
    'Total Quantity': group.totalQuantity,
    'Total Revenue': group.totalRevenue.toFixed(2),
    'Total Cost': group.totalCost.toFixed(2),
    'Total Profit': group.totalProfit.toFixed(2),
    'Average Profit Per Sale': group.averageProfitPerSale.toFixed(2),
    'Average Selling Price': group.averageSellingPrice.toFixed(2),
    'Average Buying Price': group.averageBuyingPrice.toFixed(2),
    'Profit Margin %': group.profitMarginPercentage.toFixed(2),
    'Recurring Sales': group.recurringSales,
    'One-time Sales': group.oneTimeSales,
    'Paid Sales': group.paidSales,
    'Pending Sales': group.pendingSales,
    'ROI %': group.roi.toFixed(2),
    'First Sale Date': group.firstSaleDate || '',
    'Last Sale Date': group.lastSaleDate || ''
  }));

  return arrayToCSV(csvData, headers);
}

/**
 * Format low credit platforms report for CSV export
 * @param {Object} report - Low credit platforms report
 * @returns {string} CSV formatted string
 */
function formatLowCreditPlatformsCSV(report) {
  const headers = [
    'Platform ID',
    'Platform Name',
    'Credit Balance',
    'Recent Sales Count',
    'Recent Credit Usage',
    'Average Sale Cost',
    'Last Sale Date',
    'Associated Products Count',
    'Total Product Stock',
    'Estimated Days Until Depletion',
    'Urgency Level',
    'Recommended Top-up',
    'Created At',
    'Updated At'
  ];

  const csvData = report.platforms.map(platform => ({
    'Platform ID': platform.platformId,
    'Platform Name': platform.platformName,
    'Credit Balance': platform.creditBalance.toFixed(2),
    'Recent Sales Count': platform.recentSalesCount,
    'Recent Credit Usage': platform.recentCreditUsage.toFixed(2),
    'Average Sale Cost': platform.averageSaleCost.toFixed(2),
    'Last Sale Date': platform.lastSaleDate || '',
    'Associated Products Count': platform.associatedProductsCount,
    'Total Product Stock': platform.totalProductStock,
    'Estimated Days Until Depletion': platform.estimatedDaysUntilDepletion || 'N/A',
    'Urgency Level': platform.urgencyLevel,
    'Recommended Top-up': platform.recommendedTopUp.toFixed(2),
    'Created At': platform.createdAt,
    'Updated At': platform.updatedAt
  }));

  return arrayToCSV(csvData, headers);
}

/**
 * Apply pagination to data array
 * @param {Array} data - Data array to paginate
 * @param {number} page - Page number (1-based)
 * @param {number} limit - Items per page
 * @returns {Object} Paginated result with metadata
 */
function paginateData(data, page = 1, limit = 50) {
  const totalItems = data.length;
  const totalPages = Math.ceil(totalItems / limit);
  const currentPage = Math.max(1, Math.min(page, totalPages));
  const startIndex = (currentPage - 1) * limit;
  const endIndex = Math.min(startIndex + limit, totalItems);
  
  const paginatedData = data.slice(startIndex, endIndex);
  
  return {
    data: paginatedData,
    pagination: {
      currentPage,
      totalPages,
      totalItems,
      itemsPerPage: limit,
      hasNextPage: currentPage < totalPages,
      hasPreviousPage: currentPage > 1,
      startIndex: startIndex + 1,
      endIndex
    }
  };
}

/**
 * Apply sorting to data array
 * @param {Array} data - Data array to sort
 * @param {string} sortBy - Field to sort by
 * @param {string} sortOrder - Sort order ('asc' or 'desc')
 * @returns {Array} Sorted data array
 */
function sortData(data, sortBy, sortOrder = 'desc') {
  if (!sortBy || !data.length) {
    return data;
  }

  return [...data].sort((a, b) => {
    let aValue = a[sortBy];
    let bValue = b[sortBy];

    // Handle null/undefined values
    if (aValue == null && bValue == null) return 0;
    if (aValue == null) return sortOrder === 'asc' ? -1 : 1;
    if (bValue == null) return sortOrder === 'asc' ? 1 : -1;

    // Handle numeric values
    if (typeof aValue === 'number' && typeof bValue === 'number') {
      return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
    }

    // Handle string values
    aValue = String(aValue).toLowerCase();
    bValue = String(bValue).toLowerCase();
    
    if (sortOrder === 'asc') {
      return aValue.localeCompare(bValue);
    } else {
      return bValue.localeCompare(aValue);
    }
  });
}

/**
 * Get appropriate content type and filename for format
 * @param {string} format - Output format (json, csv)
 * @param {string} reportType - Type of report
 * @returns {Object} Content type and filename
 */
function getFormatHeaders(format, reportType) {
  const timestamp = new Date().toISOString().split('T')[0];
  
  switch (format.toLowerCase()) {
    case 'csv':
      return {
        contentType: 'text/csv',
        filename: `${reportType}-report-${timestamp}.csv`,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="${reportType}-report-${timestamp}.csv"`
        }
      };
    case 'json':
    default:
      return {
        contentType: 'application/json',
        filename: `${reportType}-report-${timestamp}.json`,
        headers: {
          'Content-Type': 'application/json; charset=utf-8'
        }
      };
  }
}

module.exports = {
  arrayToCSV,
  formatPlatformProfitabilityCSV,
  formatCreditUtilizationCSV,
  formatSalesProfitCSV,
  formatLowCreditPlatformsCSV,
  paginateData,
  sortData,
  getFormatHeaders
};
