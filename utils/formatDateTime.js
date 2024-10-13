const formatDateTime = (dateTime) => {
  // Parse the dateTime string into a Date object
  const date = new Date(dateTime);

  // Extract date components
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');

  // Format the date as "dd-mm"
  const formattedDate = `${day}-${month}`;

  // Extract time components
  let hours = date.getHours();
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';

  // Convert hours to 12-hour format
  hours = hours % 12;
  hours = hours ? hours : 12; // Handle midnight (0 hours)

  // Format the time as "hh:mm AM/PM"
  const formattedTime = `${hours}:${minutes} ${ampm}`;  

  // Return the formatted date and time
  return { date: formattedDate, time: formattedTime };
}

// Example usage:
module.exports = formatDateTime;
