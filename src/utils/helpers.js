export const formatDate = (date) =>
  new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(date));

export const truncate = (str, n = 100) =>
  str.length > n ? str.slice(0, n) + '...' : str;

export const capitalize = (str) =>
  str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();

export const generateId = () =>
  Math.random().toString(36).slice(2, 9);

export const groupBy = (arr, key) =>
  arr.reduce((acc, item) => {
    const group = item[key];
    acc[group] = acc[group] || [];
    acc[group].push(item);
    return acc;
  }, {});

export const debounce = (fn, delay) => {
  let timer;
  return (...args) => { clearTimeout(timer); timer = setTimeout(() => fn(...args), delay); };
};
