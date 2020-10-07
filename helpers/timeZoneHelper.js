const moment = require('moment-timezone');

const removeDuplicates = (myArr, prop) => {
    return myArr.filter((obj, pos, arr) => {
        return arr.map(mapObj => mapObj[prop]).indexOf(obj[prop]) === pos;
    });
};

const calculateOffsetHours = (offset) => {
    let prefix = (offset >= 0) ? '+' : '-';
    const hours = String(Math.floor(Math.abs(offset)/60)).padStart(2, '0');
    const minutes = String(Math.abs(offset) % 60).padStart(2, '0');
    return hours === '00' ? '(UTC)' : `(UTC${prefix}${hours}:${minutes})`;
};

const getTimezones = () => {
    const countries = moment.tz.countries();
    let countryTimezones = countries.map((item) => {
        return moment.tz.zonesForCountry(item, true);
    });

    countryTimezones = [].concat.apply([], countryTimezones);
    countryTimezones = countryTimezones.map((item) => {
        const [region, location] = item.name.split('/').map((string) => string.replace(/[_]+/g, ' '));
        return {
            ...item,
            region,
            location,
            offsetMin: item.offset * -1,
            offset: calculateOffsetHours(item.offset * -1)
        };
    });

    countryTimezones = removeDuplicates(countryTimezones, 'name');
    countryTimezones.sort((a, b) => (b.offsetMin - a.offsetMin) + (b.name >= a.name ? 1 : -1) );

    return countryTimezones.reverse();
};

module.exports = {
    getTimezones
};