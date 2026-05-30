const { performance } = require('perf_hooks');

const bots = Array.from({ length: 1000 }, (_, i) => ({
  name: `Bot name ${i}`,
  type: i % 2 === 0 ? 'typeA' : 'typeB',
  status: i % 3 === 0 ? 'online' : 'offline',
}));

const searchQuery = 'name 5';
const statusFilter = 'online';

function originalFilter() {
  return bots.filter(bot => {
    const matchesSearch = bot.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         bot.type.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || bot.status === statusFilter;
    return matchesSearch && matchesStatus;
  });
}

function optimizedFilter() {
  const lowerSearchQuery = searchQuery.toLowerCase();
  return bots.filter(bot => {
    const matchesStatus = statusFilter === "all" || bot.status === statusFilter;
    if (!matchesStatus) return false;

    if (!lowerSearchQuery) return true;

    const lowerName = bot.name.toLowerCase();
    if (lowerName.includes(lowerSearchQuery)) return true;

    const lowerType = bot.type.toLowerCase();
    return lowerType.includes(lowerSearchQuery);
  });
}

const iterations = 10000;

let start = performance.now();
for (let i = 0; i < iterations; i++) {
  originalFilter();
}
let originalTime = performance.now() - start;

start = performance.now();
for (let i = 0; i < iterations; i++) {
  optimizedFilter();
}
let optimizedTime = performance.now() - start;

console.log(`Original Time: ${originalTime.toFixed(2)}ms`);
console.log(`Optimized Time: ${optimizedTime.toFixed(2)}ms`);
console.log(`Improvement: ${((originalTime - optimizedTime) / originalTime * 100).toFixed(2)}%`);
