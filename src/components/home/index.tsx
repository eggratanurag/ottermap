import React, { useEffect, useRef, useState } from "react";
import Map from "ol/Map";
import View from "ol/View";
import OSM from "ol/source/OSM";
import VectorSource from "ol/source/Vector";
import TileLayer from "ol/layer/Tile";
import VectorLayer from "ol/layer/Vector";
import Draw from "ol/interaction/Draw";
import "ol/ol.css";
import Polygon from "ol/geom/Polygon";
import LineString from "ol/geom/LineString";
import { getArea, getLength } from "ol/sphere";
import millify from "millify";
import Feature from 'ol/Feature'; // Make sure to import Feature
import Geometry from 'ol/geom/Geometry'; // Import Geometry to use in the Feature type


// Define the allowed types of geometries that can be drawn.
type GeometryType = "Point" | "LineString" | "Polygon" | "None";

const MapComponent: React.FC = () => {
  const mapRef = useRef<HTMLDivElement>(null); // Reference to the div element where the map will be rendered.
  const [map, setMap] = useState<Map>(); // State to hold the map object.
  const [source] = useState(new VectorSource({ wrapX: false }));  // State to hold the vector source where drawn features will be stored.
  const [drawType, setDrawType] = useState<GeometryType>("LineString"); // State to control the type of geometry being drawn.
  const [lastFeature, setLastFeature] = useState<Feature<Geometry> | null>(null);; // State to store the last drawn feature for measurement
  const [measurement, setMeasurement] = useState(""); // State to store the formatted measurement result.

  /*
  * Effect to initialize the OpenLayers map.
  * This effect runs only once after the component is mounted.
  */
  useEffect(() => {
    // Create a raster layer with OpenStreetMap tiles.
    const rasterLayer = new TileLayer({ source: new OSM() });
    
    // Create a vector layer linked to the vector source.
    const vectorLayer = new VectorLayer({ source });

    // Instantiate a new map object and assign it to the mapRef div.
    const newMap = new Map({
      target: mapRef.current!,
      layers: [rasterLayer, vectorLayer],
      view: new View({

        // Set the initial center of the map
        center: [-11000000, 4600000], 

        // Set the initial zoom level.
        zoom: 4,  
      }),
    });

    // Store the map object in state.
    setMap(newMap);

    /*
    * Cleanup function to unset the map target when the component unmounts.
    */
    return () => newMap.setTarget(undefined);
  }, []);

  /*
  *  Effect to manage drawing interactions based on the selected draw type.
  * This effect runs only once after the component is mounted.
  */
  useEffect(() => {
    if (!map || drawType === "None") return;

    // Create a new drawing interaction for the specified geometry type.
    const drawInteraction = new Draw({
      source,
      type: drawType,
    });

    // Add the drawing interaction to the map.
    map.addInteraction(drawInteraction);

    // Listen for the end of the drawing process to store the drawn feature.
    drawInteraction.on("drawend", (event) => {
      setLastFeature(event.feature);
    });

    /*
    * Cleanup function to remove the drawing interaction when it is no longer needed.
    */
    return () => { map.removeInteraction(drawInteraction) };
  }, [map, drawType, source]);


  // Handler for the measure button click event.
  const handleMeasureClick = () => {
    if (!lastFeature) return;

    // Get the geometry from the last drawn feature.
    const geometry = lastFeature.getGeometry();
    let output = "";
    if (geometry instanceof Polygon) {
        
      // Calculate the area for polygons.
      const area = getArea(geometry);
      output = `Area: ${millify(area)} square meters`;

    } else if (geometry instanceof LineString) {

      // Calculate the length for line strings.
      const length = getLength(geometry);
      output = `Length: ${millify(length)} meters`;

    }

    // Set the formatted measurement result.
    setMeasurement(output);
  };

  return (
    <>
      <div ref={mapRef} className="map" style={{ width: "100%", height: "100vh" }} ></div>
      <div className="measurementBox">
        <select className="custom-select" value={drawType} onChange={(e) => setDrawType(e.target.value as GeometryType)} >
          <option className="custom-option" value="LineString">LineString</option>
          <option className="custom-option" value="Point">Point</option>
          <option className="custom-option" value="Polygon">Polygon</option>
        </select>

        {drawType !== "Point" &&<button onClick={handleMeasureClick}>{drawType === "Polygon" ? "Measure Area" : "Measure Length"} </button>}
        {measurement && <p>{measurement}</p>}
      </div>
    </>
  );
};

export default MapComponent;
