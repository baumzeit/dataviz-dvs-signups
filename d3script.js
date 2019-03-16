window.onload = function() {

	d3.csv('./data/dvs_challenge_1_membership_time_space.csv')
		.then(data => {
			visualizeData(data)
		})

	function visualizeData(data) {

		// data clean up & processing //

		delete data.columns

		data.forEach(entry => { 
			const date = new Date(entry.date)
			entry.date = date

			delete entry.long
			delete entry.lat
			delete entry.date_with_hour

			entry.data = parseFloat(entry.data)
			entry.visualization = parseFloat(entry.visualization)
			entry.society = parseFloat(entry.society)
		})

		data.sort((a,b) => a.date - b.date )

		const groupedByDay = d3.nest() // middle step for further processing (daily mean)
			.key(d => d.date)
			.entries(data)

		const meanCats = ['society', 'data', 'visualization'] // keys subjected to mean calculation

		const statsByCats = dayData => {
			const values = dayData.values
			const result = { dateString: dayData.key, num: values.length }

			const meanCatsData = meanCats.forEach(cat => {
				const meanCatData = d3.mean(values, d => d[cat])
				Object.assign(result, { [cat]: meanCatData } )
			})

			return result
		}

		const statsByDay = groupedByDay.map(statsByCats)	


		// chart config

		const xTickSize = 600
		const yTickSize = 1050
		
		const height = 600
		const width = 1120

		const margin = { top: 20, right: 120, bottom: 10, left: 30 }
		
		const svg = d3.select('#dataviz')
			.append('svg')
			.attr('width', width + margin.left + margin.right)
			.attr('height', height + margin.top + margin.bottom)
		


		// scales

		const xScale = d3.scaleTime()
			.domain(d3.extent(statsByDay, d => new Date(d.dateString)))
			.range([margin.left, width - margin.right])

		const extentOfMeans = d3
			.extent(statsByDay.reduce((list, entry) => {
				return list.concat(meanCats.map(cat => entry[cat]))
				}, [])
			)

		const yScale = d3.scaleLinear()
			.domain(extentOfMeans)
			.range([height - margin.bottom, margin.top])
			.nice(18)

		const fillScale = d3.scaleOrdinal()
			.domain(['data', 'visualization', 'society'])
			.range(d3.schemeCategory10)

		const signupsExtent = d3.extent(statsByDay, d => d.num)

		const dailySignupsScaleWidth = d3.scaleLinear()
			.domain(signupsExtent)
			.range([2, 55])


		// data visualization

		statsByDay.forEach((day, i) => {
			svg
				.append('rect')	// signup rate rect
				.attr('class', 'dailySignups-' + i)
				.attr('x', () => (xScale(new Date(day.dateString)) - dailySignupsScaleWidth(day.num)/2))
				.attr('y', margin.bottom)
				.attr('height', height)
				.attr('width', dailySignupsScaleWidth(day.num))
				.style('fill', 'white')
				.style('opacity', 0.1)

			const barWidth = width / Object.keys(statsByDay).length

			svg
				.append('rect') // signup rate event area
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


			meanCats.forEach((cat, i) => {
				const line = d3.line()
					.x(d => xScale(new Date(d.dateString)))
					.y(d => yScale(d[cat]))
				svg
					.append('path') // evaluation data lines
					.attr('id', cat + '-line-' + i)
					.attr('class', 'line')
					.attr('d', line(statsByDay))
					.attr('fill', 'none')
					.attr('stroke', fillScale(cat))
					.attr('stroke-width', 2)
					.style('opacity', 0.2)

				svg
					.append('path') // evaluation data event area
					.attr('class', 'line-hover')
					.attr('d', line(statsByDay))
					.attr('fill', 'none')
					.attr('stroke', 'transparent')
					.attr('stroke-width', 15)
					.on('mouseenter', function() {
						d3.select(`#${cat}-line-${i}`)
						.style('stroke-width', 6)
					})
					.on('mouseleave', function() {
						d3.select(`#${cat}-line-${i}`)
						.style('stroke-width', 2)
					})

				svg
					.append('circle') // data points
					.attr('class', 'dailyMeanPoint')
					.attr('cx', xScale(new Date(day.dateString)))
					.attr('cy', yScale(day[cat]))
					.attr('r', 2)
					.style('fill', 'white')
			})
		})

		d3.selectAll('path.line-hover').raise()
		d3.selectAll('circle.dailyMeanPoint').raise()


		// create axes

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


		// create legends

		const legends = svg
			.append('g')
			.attr('id', 'legends')
			.attr('transform', `translate(${width + 20},${margin.top + 5})`)

		const legendLines = d3.legendColor()
			.title('daily average')
  			.scale(fillScale)
  			.shapePadding(4)
  		
		const legendBands = d3.legendSize()
			.title('daily signups')
			.labels(['20', '400', '750'])
  			.scale(dailySignupsScaleWidth)
  			.shape('line')
  			.shapePadding(4)
  			.ascending(true)
  			.cells(3)
			
		legends
			.append('g')
			.attr('class', 'legendLines')
			.call(legendLines)

		legends
			.append('g')
			.attr('class', 'legendBands')
			.attr('transform', `translate(0, 130)`)
			.call(legendBands)
		
		d3.select('.legendBands').select('.legendCells').attr('transform', 'translate(36, 27)')


	}
}