/**
 * Needed to send csrf token to django
 * See https://docs.djangoproject.com/en/1.8/ref/csrf/#ajax
 */
export function getCookie(name) {
  let cookieValue = null;
  if (document.cookie && document.cookie !== "") {
    const cookies = document.cookie.split(";");
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i].trim();
      // Does this cookie string begin with the name we want?
      if (cookie.substring(0, name.length + 1) === name + "=") {
        cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
        break;
      }
    }
  }
  return cookieValue;
}

export const dateformatter = (isodate) => {
  const newdate = new Date(Date.parse(isodate));
  const d = newdate.getDate();
  const m = newdate.getMonth() + 1;
  return `${d <= 9 ? "0" + d : d}.${
    m <= 9 ? "0" + m : m
  }.${newdate.getFullYear()}`;
};

export function initCap(str) {
  if (!str) {
    return str;
  }
  if (str.length === 1) {
    return str.substring(0, 1).toUpperCase();
  } else if (str.length >= 1) {
    return str.substring(0, 1).toUpperCase() + str.substring(1);
  }
  return str;
}

export function underscoreToBlank(str) {
  if (!str) {
    return str;
  }
  return str.replaceAll(/_/g, " ");
}
