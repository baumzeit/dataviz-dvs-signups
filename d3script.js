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

		const xTickSize = 500
		const yTickSize = 1000
		
		const height = 550
		const width = 1120

		const margin = { top: 80, right: 120, bottom: 10, left: 80 }
		
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
			.range([2, 50])


		// data visualization

		statsByDay.forEach((day, i) => {

			const dayX = xScale(new Date(day.dateString))

			svg
				.append('rect')	// signup rate rect
				.attr('class', `dailySignupsRect-${i}`)
				.attr('x', dayX - dailySignupsScaleWidth(day.num)/2)
				.attr('y', margin.top - 20)
				.attr('height', xTickSize + 8)
				.attr('width', dailySignupsScaleWidth(day.num))
				.style('fill', 'white')
				.style('opacity', 0.1)

			const barWidth = width / Object.keys(statsByDay).length

			svg
				.append('rect') // signup rate event area
				.attr('class', 'dailySignupsRect-hover')
				.attr('x', dayX - barWidth / 2)
				.attr('y', margin.top - 20)
				.attr('height', height)
				.attr('width', barWidth)
				.style('fill', 'transparent')
				.on('mouseenter', () => {
					d3.select(`.dailySignupsRect-${i}`)
						.transition()
						.duration(30)
						.style('opacity', 0.2)
					d3.selectAll(`.dailyMeanText-${i}`)
						.transition()
						.duration(60)
						.style('opacity', 1)

				})
				.on('mouseleave', () => {
					d3.selectAll(`.dailyMeanText-${i}`)
						.transition()
						.duration(60)
						.style('opacity', 0)
					d3.select(`.dailySignupsRect-${i}`)
						.transition()
						.duration(30)
						.style('opacity', 0.1)
				})	

			// daily signups annotation

			svg
				.append('text')
				.attr('class', 'dailySignupsText')
				.attr('x', dayX)
				.attr('y', margin.top - 28)
				.text(day.num)
				.style('fill', 'white')
				.style('text-anchor', 'middle')		


			meanCats.forEach((cat, j) => {
				const line = d3.line()
					.x(d => xScale(new Date(d.dateString)))
					.y(d => yScale(d[cat]))
				svg
					.append('path') // evaluation data lines
					.attr('id', cat + '-line-' + j)
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
						d3.select(`#${cat}-line-${j}`)
						.style('stroke-width', 6)
						d3.selectAll(`.dailyMeanText-${cat}`)
						.transition()
						.duration(60)
						.style('opacity', 1)
					})
					.on('mouseleave', function() {
						d3.select(`#${cat}-line-${j}`)
						.style('stroke-width', 2)
						d3.selectAll(`.dailyMeanText-${cat}`)
						.transition()
						.duration(10)
						.style('opacity', 0)
					})

				svg
					.append('circle') // data points
					.attr('class', 'dailyMeanPoint')
					.attr('cx', dayX)
					.attr('cy', yScale(day[cat]))
					.attr('r', 2)
					.style('fill', 'white')


				// daily mean annotation

				const textFormat = d3.format('.2f')

				svg
					.append('text') // data points
					.attr('class', `dailyMeanText dailyMeanText-${cat} dailyMeanText-${i}`)
					.attr('x', dayX + 5)
					.attr('y', yScale(day[cat]) + 15)
					.text(textFormat(day[cat]))
					.style('fill', d3.color(fillScale(cat)).brighter(5))
					.style('opacity', 0)

			})
		})

		d3.selectAll('text.dailyMeanText-visualization')
			.attr('dx', -35)

		d3.selectAll('path.line-hover').raise()
		d3.selectAll('circle.dailyMeanPoint').raise()
		d3.selectAll('text.dailyMeanText').raise()


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
			.attr('transform', `translate(0, ${margin.top + xTickSize - 15})`)
			.call(xAxis)

		svg
			.append('g')
			.attr('id', 'yAxisRightG')
			.attr('transform', `translate(${margin.left + yTickSize - 35}, 0)`)
			.call(yAxis)

		svg
			.append('g')
			.attr('id', 'yAxisLeftG')
			.attr('transform', `translate(${margin.left - 70}, 0)`)
			.call(yAxis)

		d3.selectAll('#yAxisLeftG .tick line').remove() // remove axis tick lines for second yAxis(already drawn)

		d3.select('#yAxisLeftG') // yAxis title
			.append('text')
			.attr('class', 'axisTitle')
			.text('score')
			.attr('dx', -10)
			.attr('dy', 60)
			.style('fill', 'black')

		svg
			.append('text')
			.attr('class', 'axisTitle')
			.text('# signups')
			.attr('dx', 50)
			.attr('dy', 30)
			.style('fill', 'black')



		// create legends

		const legends = svg
			.append('g')
			.attr('id', 'legends')
			.attr('transform', `translate(${width + 10},${margin.top - 30})`)

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
			.attr('transform', `translate(0, 110)`)
			.call(legendBands)
		
		d3.select('.legendBands').select('.legendCells').attr('transform', 'translate(36, 27)')


	}
}