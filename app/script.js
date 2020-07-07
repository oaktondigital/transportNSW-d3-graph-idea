// Adapted from https://bl.ocks.org/denjn5/e1cdbbe586ac31747b4a304f8f86efa5

var d3; // Defined by import of d3 in index.html

// Variables
var width = document.querySelector("#vizWrapper").clientWidth;
var height = document.querySelector("#vizWrapper").clientHeight;

// Settings
const DEBUG = true;
const paddingBetweenRings = 0.02; // percentage of height
const centerCircleRadius = 1 / 6; // percentage of height, 1/6 as there are 6 layers from center to edge
const remainingRadius = 1 - centerCircleRadius;

console.log("Viewport size: ", width, height);
var radius = Math.min(width, height) / 2;
const PI = Math.PI;

const degreesToPI = degrees => Math.PI * (degrees / 180);

// Create primary <g> element
var g = d3
  .select("#viz")
  .attr("width", width)
  .attr("height", height)
  // Add root element and centre it
  .append("g")
  .attr("transform", "translate(" + width / 2 + "," + height + ")");

// Data for graph
const data = {
  centerName: "Mission Critical Assets",
  angle: [-90, 90],
  color: "#009950",
  arcs: [
    {
      angle: [-90, -60],
      layers: [
        {
          name: "1. Policy Management",
          color: "#5697d9",
          items: [
            "abc",
            "abc",
            "abc",
            "abc",
            "abc",
            "abc",
            "abc",
            "abc",
            "abc",
            "abc"
          ]
        }
      ]
    },

    {
      angle: [-60, 60],
      layers: [
        {
          name: "2. Data",
          color: "#00a2f6",
          items: [
            "abc",
            "abc",
            "abc",
            "abc",
            "abc",
            "abc",
            "abc",
            "abc",
            "abc",
            "abc"
          ]
        },
        {
          name: "3. Application",
          color: "#a6a5a6",
          items: ["abc", "abc", "abc", "abc", "abc"]
        },
        {
          name: "4. Endpoint",
          color: "#8fc24c",
          items: ["abc", "abc", "abc", "abc", "abc", "abc", "abc"]
        },
        {
          name: "5. Perimeter and Network",
          color: "#ffba00",
          items: [
            "abc",
            "abc",
            "abc",
            "abc",
            "abc",
            "abc",
            "abc",
            "abc",
            "abc",
            "abc",
            "abc",
            "abc",
            "abc"
          ]
        },
        {
          name: "6. Public/Privare Cloud",
          color: "#fcceac",
          items: [
            "abc",
            "abc",
            "abc",
            "abc",
            "abc",
            "abc",
            "abc",
            "abc",
            "abc",
            "abc"
          ]
        }
      ]
    },

    {
      angle: [60, 70],
      layers: [
        { name: "7. Platforms", color: "#ffe6d6", items: ["abc", "abc", "abc"] }
      ]
    },

    {
      angle: [70, 90],
      layers: [
        {
          name: "8. Operations",
          color: "#5697d9",
          items: ["abc", "abc", "abc", "abc", "abc", "abc", "abc", "abc", "abc"]
        }
      ]
    }
  ]
};

const partialAngle = (idx, angle, amount, layers) => {
  const startAngle = angle[0];
  const endAngle = angle[1];
  const angleDistance = endAngle - startAngle;
  const partialAngleDistance = angleDistance / amount;

  const partialStartAngle = startAngle + idx * partialAngleDistance;
  const partialEndAngle = startAngle + (idx + 1) * partialAngleDistance;
  return [partialStartAngle, partialEndAngle];
};

const denormalizedArcs = data.arcs
  .map(arc =>
    arc.layers.reduce(
      (arr, layer, layerIndex, layers) =>
        arr.concat({
          name: layer.name,
          angle: arc.angle,
          color: layer.color,
          radius: [
            centerCircleRadius +
              (layerIndex / layers.length) * remainingRadius +
              paddingBetweenRings,
            centerCircleRadius +
              ((layerIndex + 1) / layers.length) * remainingRadius
          ],
          items: layer.items.map((item, idx, items) => ({
            name: item,
            angle: partialAngle(idx, arc.angle, items.length, layers.length)
          }))
        }),
      []
    )
  )
  .reduce((arr, arc) => arr.concat(arc), []);

const denormalizedData = [
  {
    name: data.centerName,
    angle: data.angle,
    color: data.color,
    radius: [0, centerCircleRadius],
    items: []
  },
  ...denormalizedArcs
];

const denormalizedItems = denormalizedData.reduce(
  (arr, arc) =>
    arr.concat(
      arc.items.map((item, idx, arr) => ({
        angle: item.angle,
        radius: arc.radius,
        item,
        linearScale: (idx + 1) / arr.length
      }))
    ),
  []
);

console.log(denormalizedItems);

// ***************
// Arcs
// ***************

var arcFn = d3
  .arc()
  .innerRadius(d => d.radius[0] * height)
  .outerRadius(d => d.radius[1] * height)
  .startAngle(d => degreesToPI(d.angle[0]))
  .endAngle(d => degreesToPI(d.angle[1]));

g.selectAll("arc")
  .data(denormalizedData)
  .attr("class", "arc")
  .enter()
  .append("path")
  .attr("d", arcFn)
  .style("fill", d => d.color)
  .style("stroke", "black");

// ***************
// labels
// ***************
var arcLabelsFn = d3
  .arc()
  .innerRadius(d => d.radius[0] * height)
  .outerRadius(d => (d.radius[0] + (d.radius[1] - d.radius[0]) / 2) * height)
  .startAngle(d => degreesToPI(d.angle[0]))
  .endAngle(d => degreesToPI(d.angle[1]));

g.selectAll("labels")
  .data(denormalizedData)
  .attr("class", "arc-labels")
  .enter()
  .append("text")
  .text(d => d.name)

  // Center the text in the ring
  // Rotate labels to make angle if its a large slice (policy, ops etc)
  .attr("transform", d => {
    const [x, y] = arcLabelsFn.centroid(d);
    const rotateSideLabels = d.angle[0] >= 60 
    ? `rotate(${(d.angle[1] + d.angle[0]) / 2 - 90} )` 
    : d.angle[1] <= -60 
    ? `rotate(${(d.angle[1] + d.angle[0]) / 2 + 90} )` 
    : ""
    return `translate(${[x, y + height / 80]}) ${rotateSideLabels}`;
  })

  // Text is anchored to the middle of the label
  .attr("text-anchor", "middle")



  // Scale label size based on pixel height of chart
  .attr("font-size", 0.025 * height)
  .attr("font-weight", 700);

// ***************
// Items inside each arc
// ***************

// Show red arc sections - only for debugging
g.selectAll("arc")
  .data(DEBUG ? denormalizedItems : [])
  .attr("class", "arc")
  .enter()
  .append("path")
  .attr("d", arcFn)
  .style("stroke", "red")
  .style("fill-opacity", 0);

g.selectAll("items")
  .data(denormalizedItems)
  .attr("class", "arc-items")
  .enter()
  .append("text")
  .text(d => d.item.name)

  // Center the text in the ring
  .attr("transform", d => {
    const [x, y] = arcFn.centroid(d);
    const rotateSideLabels = d.angle[0] >= 60 
    ? `rotate(${(d.angle[1] + d.angle[0]) / 2 - 90} )` 
    : d.angle[1] <= -60 
    ? `rotate(${(d.angle[1] + d.angle[0]) / 2 + 90} )` 
    : ""
    return `translate(${[x, y + height / 100]}) ${rotateSideLabels}`;
  })

  // Text is anchored to the middle of the label
  .attr("text-anchor", "middle")

  // Scale label size based on pixel height of chart
  .attr("font-size", 0.02 * height)
  .attr("font-weight", 700);