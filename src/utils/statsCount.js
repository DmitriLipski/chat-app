const statsCount = votes =>
	votes.length === 0
		? {min: 0, max: 0, median: 0, mean: 0}
		: {
				min: Math.min(...votes),
				max: Math.max(...votes),
				median: calcMedianValue(votes),
				mean: Number(
					(votes.reduce((a, b) => a + b, 0) / votes.length).toFixed(1),
				),
		  };

const calcMedianValue = list => {
	const sortedList = [...list].sort((a, b) => a - b);
	return sortedList.length % 2 !== 0
		? sortedList[Math.floor(sortedList.length / 2)]
		: (sortedList[sortedList.length / 2] +
				sortedList[sortedList.length / 2 - 1]) /
				2;
};

module.exports = {
	statsCount,
	calcMedianValue,
};
