import { useEffect, useRef, useCallback, forwardRef, useImperativeHandle } from 'react';
import cytoscape from 'cytoscape';
import fcose from 'cytoscape-fcose';
import { buildCytoscapeStylesheet } from '../utils/graphStyles';
import { LAYOUT_OPTIONS } from '../utils/constants';

// Register fCoSE layout extension
cytoscape.use(fcose);

const LAYOUT = { ...LAYOUT_OPTIONS };

function buildElements(graphState) {
  const nodes = (graphState.nodes || []).map((n) => ({
    data: { ...n, id: n.id },
    classes: n.status === 'dismissed' ? 'dismissed' : '',
  }));
  const edges = (graphState.edges || []).map((e) => ({
    data: {
      ...e,
      id: e.id || `${e.source}-${e.target}-${e.edge_type}`,
    },
  }));
  return [...nodes, ...edges];
}

function pulsateNode(cy, nodeId, color) {
  const node = cy.getElementById(nodeId);
  if (!node || node.empty()) return;

  node.addClass('updated');
  // Animate border pulse
  node.animate(
    { style: { 'border-width': 8, 'border-opacity': 1 } },
    {
      duration: 350,
      easing: 'ease-out',
      complete: () => {
        node.animate(
          { style: { 'border-width': 2.5, 'border-opacity': 0.7 } },
          {
            duration: 600,
            easing: 'ease-in-out',
            complete: () => node.removeClass('updated'),
          }
        );
      },
    }
  );
}

function glowNode(cy, nodeId) {
  const node = cy.getElementById(nodeId);
  if (!node || node.empty()) return;
  node.addClass('highlighted');
  setTimeout(() => node.removeClass('highlighted'), 3000);
}

const GraphCanvas = forwardRef(function GraphCanvas(
  { graphState, onNodeClick, onEdgeClick, highlightedNodeId },
  ref
) {
  const containerRef = useRef(null);
  const cyRef = useRef(null);
  const initializedRef = useRef(false);
  const layoutRunningRef = useRef(false);

  // Expose cy instance
  useImperativeHandle(ref, () => ({
    getCy: () => cyRef.current,
    pulseNode: (nodeId, color) => pulsateNode(cyRef.current, nodeId, color),
    glowNode: (nodeId) => glowNode(cyRef.current, nodeId),
    fitGraph: () => cyRef.current?.fit(undefined, 60),
    resetView: () => cyRef.current?.reset(),
    getScreenshot: () => cyRef.current?.png({ bg: '#0a0e1a', full: false, scale: 2, output: 'base64uri' }),
  }));

  // Initialize Cytoscape once
  useEffect(() => {
    if (!containerRef.current || initializedRef.current) return;
    initializedRef.current = true;

    const cy = cytoscape({
      container: containerRef.current,
      style: buildCytoscapeStylesheet(),
      layout: { name: 'preset' },
      elements: buildElements(graphState),
      minZoom: 0.3,
      maxZoom: 3,
      wheelSensitivity: 0.2,
      boxSelectionEnabled: false,
      autounselectify: false,
    });

    cyRef.current = cy;

    // Node click
    cy.on('tap', 'node', (evt) => {
      const node = evt.target;
      if (onNodeClick) onNodeClick(node.data());
      // Flash selected neighbors
      node.neighborhood().edges().addClass('highlighted');
      setTimeout(() => cy.edges().removeClass('highlighted'), 2000);
    });

    // Edge click
    cy.on('tap', 'edge', (evt) => {
      const edge = evt.target;
      if (onEdgeClick) onEdgeClick(edge.data());
    });

    // Background click to deselect
    cy.on('tap', (evt) => {
      if (evt.target === cy) {
        cy.elements().removeClass('highlighted');
      }
    });

    // Run initial layout
    cy.layout(LAYOUT).run();

    return () => {
      cy.destroy();
      cyRef.current = null;
      initializedRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update graph state imperatively on each delivery
  useEffect(() => {
    const cy = cyRef.current;
    if (!cy || !graphState || !graphState.nodes) return;

    const updatedNodeIds = [];

    cy.batch(() => {
      // Add/update nodes
      for (const nodeData of graphState.nodes) {
        const existingNode = cy.getElementById(nodeData.id);
        if (existingNode.empty()) {
          // New node — add it
          cy.add({
            group: 'nodes',
            data: { ...nodeData, id: nodeData.id },
            classes: nodeData.status === 'dismissed' ? 'dismissed' : '',
          });
        } else {
          // Update existing node data
          const wasUpdated = nodeData.updated;
          existingNode.data({ ...nodeData });
          if (nodeData.status === 'dismissed') {
            existingNode.addClass('dismissed');
          } else {
            existingNode.removeClass('dismissed');
          }
          if (wasUpdated) {
            updatedNodeIds.push(nodeData.id);
          }
        }
      }

      // Add/update edges
      for (const edgeData of graphState.edges) {
        const edgeId = edgeData.id || `${edgeData.source}-${edgeData.target}-${edgeData.edge_type}`;
        const existingEdge = cy.getElementById(edgeId);
        if (existingEdge.empty()) {
          // Only add if both endpoints exist
          const srcExists = !cy.getElementById(edgeData.source).empty();
          const tgtExists = !cy.getElementById(edgeData.target).empty();
          if (srcExists && tgtExists) {
            cy.add({
              group: 'edges',
              data: { ...edgeData, id: edgeId },
            });
          }
        } else {
          existingEdge.data({ ...edgeData });
        }
      }
    });

    // Animate updated nodes after batch
    for (const nodeId of updatedNodeIds) {
      pulsateNode(cy, nodeId);
    }

    // Run incremental layout only if new nodes were added
    const currentCount = cy.nodes().length;
    if (currentCount > 2 && !layoutRunningRef.current) {
      layoutRunningRef.current = true;
      const layout = cy.layout({
        ...LAYOUT,
        animate: true,
        animationDuration: 700,
        randomize: false,
        fit: false,
      });
      layout.on('layoutstop', () => {
        layoutRunningRef.current = false;
      });
      layout.run();
    }
  }, [graphState]);

  // Highlight specific node (e.g. from insight)
  useEffect(() => {
    const cy = cyRef.current;
    if (!cy || !highlightedNodeId) return;
    glowNode(cy, highlightedNodeId);
  }, [highlightedNodeId]);

  return (
    <div
      ref={containerRef}
      id="cy-container"
      className="relative w-full h-full"
      style={{ zIndex: 1 }}
    />
  );
});

export default GraphCanvas;
