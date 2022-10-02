# SolarClimate_VisTool
Proyect for Hackaton NASA 2022, on the challenge _Creative Data Display with the Parker Solar Probe_.

## References
* [NASA](https://sdo.gsfc.nasa.gov/data/aiahmi/)
* [Model](https://solarsystem.nasa.gov/missions/parker-solar-probe/in-depth/)

## Dependencies
* Python

To us the app write
```
python3 -m http.server
```
or
```
python -m SimpleHTTPServer
```
if you have python 2.X, to open a local server. From there just open your browser and type http://localhost:8000/index.html to make use of this visualization tool.

## Notes
Unfortunately we couldn't finish not even half of our vision of the project. The idea was to use webscraping to get images from [Parker Solar Probe website](https://sdo.gsfc.nasa.gov/data/aiahmi/), and use them to create a 3D visualization(or at least partially) of this phenomenon. We got stuck on technical problems regarding the THREE.js framework(couldn't manipulate the imported meshes, find how to manipulate uv's, make the sun emmisive, etc) so sadly we throw the towel at this point. However we had some fun trying to tackle the inital problem and we thank NASA and our local organizers for this oportunity.

That's all folks.

