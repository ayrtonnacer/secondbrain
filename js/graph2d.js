// ========================================
// GRAPH2D.JS - Vista 2D con D3.js force
// ========================================

const Graph2DManager = (() => {
  let svg, simulation;

  function init() {
    svg = d3.select('#graph-svg');
    render();
  }

  function render() {
    const { nodes, links } = NotesManager.getConnectionGraph();
    svg.selectAll('*').remove();
    
    const width = window.innerWidth;
    const height = window.innerHeight - 60;
    
    simulation = d3.forceSimulation(nodes)
      .force('link', d3.forceLink(links).id(d => d.id).distance(150))
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(width / 2, height / 2));
    
    const link = svg.append('g')
      .selectAll('line')
      .data(links)
      .join('line')
      .attr('class', 'link');
    
    const node = svg.append('g')
      .selectAll('g')
      .data(nodes)
      .join('g')
      .attr('class', 'node')
      .call(d3.drag()
        .on('start', dragstarted)
        .on('drag', dragged)
        .on('end', dragended))
      .on('click', (e, d) => UIManager.openViewModal(d.id));
    
    node.append('circle')
      .attr('r', 40)
      .attr('fill', '#fff')
      .attr('stroke', '#ddd')
      .attr('stroke-width', 2);
    
    node.append('text')
      .text(d => d.title.substring(0, 15))
      .attr('text-anchor', 'middle')
      .attr('y', 50);
    
    simulation.on('tick', () => {
      link
        .attr('x1', d => d.source.x)
        .attr('y1', d => d.source.y)
        .attr('x2', d => d.target.x)
        .attr('y2', d => d.target.y);
      
      node.attr('transform', d => `translate(${d.x},${d.y})`);
    });
    
    function dragstarted(event) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      event.subject.fx = event.subject.x;
      event.subject.fy = event.subject.y;
    }
    
    function dragged(event) {
      event.subject.fx = event.x;
      event.subject.fy = event.y;
    }
    
    function dragended(event) {
      if (!event.active) simulation.alphaTarget(0);
      event.subject.fx = null;
      event.subject.fy = null;
    }
  }

  function search(query) {
    // Implementar filtrado
  }

  return { init, render, search };
})();

window.Graph2DManager = Graph2DManager;
