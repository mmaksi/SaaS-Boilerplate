class DateFormatter {
  getCurrentDate() {
    const currentDate = new Date();
    return this.formatDate(currentDate);
  }

  formatDate(date: Date) {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0'); // Months are zero-based
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  getReportDate() {
    const currentDate = new Date();
    currentDate.setDate(currentDate.getDate() + 7); // Add 7 days to the current date
    return this.formatDate(currentDate);
  }
}

export const dateFormatter = new DateFormatter();
