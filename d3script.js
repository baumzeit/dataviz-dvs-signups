window.onload = function() {

	d3.csv('./data/dvs_challenge_1_membership_time_space.csv')
		.then(data => {
			visualizeData(data);
		});

	function visualizeData(data) {

		// data clean up & processing //

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

		const groupedByDay = d3.nest() // middle step for further processing (daily mean)
			.key(d => d.date)
			.entries(data)

		const meanCats = ['society', 'data', 'visualization']; // keys subjected to mean calculation

		const statsByCats = dayData => {
			const values = dayData.values;
			const result = { dateString: dayData.key, num: values.length }

			const meanCatsData = meanCats.forEach(cat => {
				const meanCatData = d3.mean(values, d => d[cat]);
				Object.assign(result, { [cat]: meanCatData } );
			});

			return result;
		}

		const statsByDay = groupedByDay.map(statsByCats);	
		console.log(statsByDay)


		// diagram setup

		const xTickSize = 600;
		const yTickSize = 1100;
		
		const height = 600;
		const width = 1120;

		const margin = { top: 30, right: 55, bottom: 10, left: 30 };
		
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
			.nice(18)

		const fillScale = d3.scaleOrdinal()
			.domain(['data', 'visualization', 'society'])
			.range(d3.schemeCategory10)

		const signupsExtent = d3.extent(statsByDay, d => d.num);

		const dailySignupsScaleWidth = d3.scaleLinear()
			.domain(signupsExtent)
			.range([1, 50])

		const dailySignupsScaleFill = d3.scaleLinear()
			.interpolate(d3.interpolateHsl)
			.domain(signupsExtent)
			.range(['white', 'magenta'])


		statsByDay.forEach((day, i) => {
			svg
				.append('rect')
				.attr('class', 'dailySignups-' + i)
				.attr('x', () => (xScale(new Date(day.dateString)) - dailySignupsScaleWidth(day.num)/2))
				.attr('y', margin.bottom)
				.attr('height', height)
				.attr('width', dailySignupsScaleWidth(day.num))
				.style('fill', dailySignupsScaleFill(day.num))
				.style('opacity', 0.1)

			const barWidth = width / Object.keys(statsByDay).length

			svg
				.append('rect')
				.attr('class', 'dailySignups-hover')
				.attr('x', () => (xScale(new Date(day.dateString)) - barWidth / 2))
				.attr('y', margin.bottom)
				.attr('height', height)
				.attr('width', barWidth)
				.style('fill', 'transparent')
				.on('mouseenter', () => {
					d3.select(`.dailySignups-${i}`)
						.transition()
						.duration(30)
						.style('opacity', 0.2)
				})
				.on('mouseleave', () => {
					d3.select(`.dailySignups-${i}`)
						.transition()
						.duration(10)
						.style('opacity', 0.1)
				})			


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
					.attr('stroke-width', 2)
					.style('opacity', 0.3)

				svg
					.append('circle')
					.attr('class', 'dailyMeanPoint')
					.attr('cx', xScale(new Date(day.dateString)))
					.attr('cy', yScale(day[cat]))
					.attr('r', 2)
					.style('fill', 'white')
			});
		});

		d3.selectAll('circle.dailyMeanPoint').raise();		

		const xAxis = d3.axisBottom()
			.scale(xScale)
			.tickSize(-xTickSize)
			.ticks(18, d3.timeFormat('%b %d'))
			.tickPadding(10)

		const yAxis = d3.axisRight()
			.scale(yScale)
			.tickSize(-yTickSize)
			.ticks(10)
			.tickPadding(10)

		svg
			.append('g')
			.attr('id', 'xAxisG')
			.attr('transform', `translate(0, ${xTickSize + 10})`)
			.call(xAxis)

		svg
			.append('g')
			.attr('id', 'yAxisG')
			.attr('transform', `translate(${yTickSize}, 0)`)
			.call(yAxis)
	}
}