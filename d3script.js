window.onload = function() {

	d3.csv('./data/dvs_challenge_1_membership_time_space.csv')
		.then(data => {
			visualizeData(data);
		});

	function visualizeData(data) {
		delete data.columns;

		data.forEach(entry => { 
			const date = new Date(entry.date);
			entry.date = date;

			delete entry.long;
			delete entry.lat;
			delete entry.date_with_hour;

			entry.data = parseFloat(entry.data)
			entry.visualization = parseFloat(entry.visualization)
			entry.society = parseFloat(entry.society)
		});

		data.sort((a,b) => a.date - b.date )

		const groupedByDay = d3.nest()
			.key(d => d.date)
			.entries(data)

		const meanCats = ['society', 'data', 'visualization'];

		const statsByCats = meanCats => dayData => {
			const values = dayData.values;
			const result = { dateString: dayData.key, num: values.length }

			const meanCatsData = meanCats.forEach(cat => {
				const meanCatData = d3.mean(values, d => d[cat]);
				Object.assign(result, { [cat]: meanCatData } );
			});

			return result;
		}

		const statsByDay = groupedByDay.map(statsByCats(meanCats))	

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
			.domain(d3.extent(statsByDay, d => new Date(d.dateString)))
			.range([margin.left, width - margin.right])

		const extentOfMeans = d3
			.extent(statsByDay.reduce((list, entry) => {
				return list.concat(meanCats.map(cat => entry[cat]));
				}, [])
			)

		const yScale = d3.scaleLinear()
			.domain(extentOfMeans)
			.range([height - margin.bottom, margin.top])

		const fillScale = d3.scaleOrdinal()
			.domain(['data', 'visualization', 'society'])
			.range(['#fcd88a', '#cf7c1c', '#93c464'])


		statsByDay.forEach(day => {
			meanCats.forEach(cat => {
				const line = d3.line()
					.x(d => xScale(new Date(d.dateString)))
					.y(d => yScale(d[cat]))
				svg
					.append('path')
					.attr('id', cat + '-line')
					.attr('d', line(statsByDay))
					.attr('fill', 'none')
					.attr('stroke', fillScale(cat))
					.attr('stroke-width', 1)
					.style('opacity', 0.3)
			});
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

		function generateAvgTrace(data, fn) {
			
			const trace = [];
			data.reduce((sum, entry, i) => {
				const newSum = sum + fn(entry);
				trace.push(newSum / (i + 1));
				return newSum;
			}, 0)
			return trace;
		}
	}
}