# Identifying_IntertidalZone_GEE
Algorithm for identifying the intertidal zone through standard deviation of NDWI images using the Earth Engine Code Editor

You should atempt to somethings:

1) The choosen images has to be cloud free (look for good ones before using this algorithm)
2) You can use the https://geojson.io/#map=2/20.0/0.0 for creating the geometry
3) If needed, you can change the visualization parameters to fit your images
4) You should analyse the generated histograms to see if the otsu methodology should be applied once more
5) Don't forget to correct the folder in your GoogleDrive root for exporting the features and images

The Otsu methodology was writen from: Otsu, N. (1979), A Threshold Selection Method from Gray-Level Histograms. IEEE Transactions on Systems, Man, and Cybernetics, 9(1), 62-66.

Workflow:
![image](https://user-images.githubusercontent.com/112116647/188515591-b869bd14-d2b4-424d-a942-a785f328eb61.png)
