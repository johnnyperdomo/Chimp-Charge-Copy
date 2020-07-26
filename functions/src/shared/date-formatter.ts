import * as moment from 'moment';

export function formatUnixDate(date: number) {
  return moment.unix(date).format('MMMM Do, YYYY');
}
