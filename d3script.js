window.onload = function() {

	d3.csv('./data/dvs_challenge_1_membership_time_space.csv')
		.then(data => {
			visualizeData(data);
		});

	function visualizeData(data) {
		delete data.columns;

		data.forEach(entry => { 
			const date = new Date(entry.date);
			date.setHours(entry.hour);
			entry.date = date;

			delete entry.long;
			delete entry.lat;
			delete entry.date_with_hour;
			delete entry.hour;

			entry.data = parseFloat(entry.data)
			entry.visualization = parseFloat(entry.visualization)
			entry.society = parseFloat(entry.society)
		});

		const avgLine = {};

		progAvgData = data.reduce((prevAvg, curr, i) => { //////////////////////////////////////////
			const newAvg = i === 0 ? +curr : (prevAvg[prevAvg.length - 1] + +curr) / prevAvg.length
			prevAvg.push(newAvg)
			return prevAvg;
		}, [])

		const xTickSize = 450;
		const yTickSize = 1100;
		
		const height = 450;
		const width = 1120;

		const margin = { top: 30, right: 55, bottom: 10, left: 15 };
		
		const svg = d3.select('#dataviz')
			.append('svg')
			.attr('width', width + margin.left + margin.right)
			.attr('height', height + margin.top + margin.bottom)
		
		const xScale = d3.scaleTime()
			.domain(d3.extent(data, d => d.date))
			.range([margin.left, width - margin.right])
	
		const yScale = d3.scaleLinear()
			.domain([0, 5])
			.range([height - margin.bottom, margin.top])

		const fillScale = d3.scaleOrdinal()
			.domain(['data', 'visualization', 'society'])
			.range(['#fcd88a', '#cf7c1c', '#93c464'])

		Object.keys(data[0]).forEach(key => {
			if (key !== 'date') {
				const line = d3.line()
					.x(d => xScale(d.date))
					.y((d, i) => yScale())
					.curve(d3.curveCardinal);
				svg
					.append('path')
					.attr('id', key + '-line')
					.attr('d', line(data))
					.attr('fill', fillScale(key))
					.attr('stroke', fillScale(key))
					.attr('stroke-width', 2)
					.style('opacity', 0.3)
			}
		});

// 		const xAxis = d3.axisBottom()
// 			.scale(xScale)
// 			.tickSize(-xTickSize)
// 
// 		const yAxis = d3.axisRight()
// 			.scale(yScale)
// 			.tickSize(-yTickSize)
// 			.ticks(20)
// 
// 		svg
// 			.append('g')
// 			.attr('id', 'xAxisG')
// 			.attr('transform', `translate(0, ${xTickSize + 10})`)
// 			.call(xAxis)
// 
// 		svg
// 			.append('g')
// 			.attr('id', 'yAxisG')
// 			.attr('transform', `translate(${yTickSize}, 0)`)
// 			.call(yAxis)
	}
}