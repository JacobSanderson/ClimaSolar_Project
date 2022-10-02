from my_libs.my_utilities import loadImages
from pathlib import Path

dr = Path("../../20221001143303_512_aia_0171/img/")
imgsPaths =  [str(dr) for dr in dr.iterdir()] 
imgs = loadImages(imgsPaths)

import numpy as np
import matplotlib.pyplot as plt
fig, ax = plt.subplots()

ds = 52
width, height, _ = imgs[0].shape

def createMask(w, h, radius=None):
    center = (w//2, h//2)
    if radius==None:
        radius = center[0]
    else:
        radius = radius

    X,Y = np.ogrid[:w ,:h]
    r = np.sqrt((X-center[0])**2 + (Y-center[1])**2)
    return (r <= radius)

mask = createMask(width, height, (width-2*ds)//2)

img_mask_r = imgs[0][:,:,0]*mask
img_mask_g = imgs[0][:,:,1]*mask
img_mask_b = imgs[0][:,:,2]*mask
img_mask = np.dstack( (img_mask_r, img_mask_g, img_mask_b) )
img_mask = img_mask[ ds:width-ds, ds:height-ds, : ]


ax.imshow( img_mask )
plt.show()

