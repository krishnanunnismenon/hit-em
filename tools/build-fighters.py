"""Author original articulated reconstruction of the approved visible fighters.
Blender --background --threads 2 --python tools/build-fighters.py -- --render=none
Coordinates are runtime Y-up; p() maps them to Blender Z-up. Geometry is native,
editable solid sculpture; verification PNGs never enter the gameplay renderer.
"""
from pathlib import Path
import math, json, sys, struct, hashlib, datetime, shutil
import bpy
from mathutils import Vector
from mathutils.bvhtree import BVHTree

FACE_SURFACE = None

ROOT = Path(__file__).resolve().parents[1]
MODEL_DIR = ROOT / 'public/models'
SOURCE_DIR = ROOT / 'assets/models'
RENDER_DIR = ROOT / 'docs/design/model-turnarounds/completion-pass'
EVIDENCE_DIR = ROOT / '.impeccable/review/completion-models'
for folder in (MODEL_DIR, SOURCE_DIR, RENDER_DIR, EVIDENCE_DIR):
    folder.mkdir(parents=True, exist_ok=True)
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)


def p(v):
    return (v[0], -v[2], v[1])


def material(name, hex_color, rough=.28, metal=.035):
    h = hex_color.lstrip('#')
    color = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    color = [c / 12.92 if c <= .04045 else ((c + .055) / 1.055) ** 2.4 for c in color]
    m = bpy.data.materials.new(name)
    m.diffuse_color = (*color, 1)
    m.use_nodes = True
    node = m.node_tree.nodes.get('Principled BSDF')
    node.inputs['Base Color'].default_value = (*color, 1)
    node.inputs['Roughness'].default_value = rough
    node.inputs['Metallic'].default_value = metal
    return m


mats = {
    'player_skin': material('Warm tan moulded plastic', '#be8756', .28),
    'rival_skin': material('Rival warm tan plastic', '#d0a474', .29),
    'blue': material('Cobalt boxing leather', '#165ec0', .21, .06),
    'red': material('Scarlet boxing leather', '#c64128', .23, .045),
    'black': material('Black lacquered curls', '#17191e', .24, .055),
    'brown': material('Chestnut quiff', '#583023', .25, .05),
    'dark': material('Charcoal trunks', '#202731', .31),
    'cream': material('Cream trunks and boots', '#efe2cc', .33),
    'joint': material('Joint socket charcoal bronze', '#35271d', .45, .1),
    'ink': material('Serious printed ink', '#171717', .72, 0),
    'white': material('Printed white', '#f4ecdb', .68, 0),
    'sole': material('Boot sole rubber', '#25232a', .55, 0),
}


def group(name, parent=None, location=(0, 0, 0)):
    o = bpy.data.objects.new(name, None)
    bpy.context.collection.objects.link(o)
    if parent:
        o.parent = parent
    o.location = p(location)
    return o


def mesh(name, verts, faces, mat, parent, location=(0, 0, 0), smooth=True, sub=0):
    data = bpy.data.meshes.new(name + ' Mesh')
    data.from_pydata([p(v) for v in verts], [], faces)
    data.update()
    o = bpy.data.objects.new(name, data)
    bpy.context.collection.objects.link(o)
    o.parent = parent
    o.location = p(location)
    o.data.materials.append(mat)
    for poly in data.polygons:
        poly.use_smooth = smooth
    if sub:
        mod = o.modifiers.new('Editable mould subdivision', 'SUBSURF')
        mod.levels = sub
        mod.render_levels = sub
    return o


def bevel_box(name, dimensions, mat, parent, location=(0, 0, 0), bevel=.025):
    x, y, z = [a * .5 for a in dimensions]
    verts = [(sx * x, sy * y, sz * z) for sx, sy, sz in [(-1,-1,-1),(1,-1,-1),(1,1,-1),(-1,1,-1),(-1,-1,1),(1,-1,1),(1,1,1),(-1,1,1)]]
    faces = [(0,3,2,1),(4,5,6,7),(0,1,5,4),(1,2,6,5),(2,3,7,6),(3,0,4,7)]
    o = mesh(name, verts, faces, mat, parent, location)
    mod = o.modifiers.new('Mould edge bevel', 'BEVEL')
    mod.width = bevel
    mod.segments = 3
    weighted = o.modifiers.new('Controlled planar normals', 'WEIGHTED_NORMAL')
    weighted.keep_sharp = True
    weighted.weight = 45
    return o


def section_interp(sections, y):
    i = 0
    for i in range(len(sections) - 1):
        if y <= sections[i + 1][0]:
            break
    a, b = sections[i], sections[i + 1]
    t = max(0, min(1, (y - a[0]) / (b[0] - a[0])))
    return [a[k] * (1 - t) + b[k] * t for k in range(1, len(a))]


def loft(name, sections, mat, parent, location=(0,0,0), radial=24, square=.6, deform=None, sub=1):
    verts, faces = [], []
    angles = [2 * math.pi * j / radial for j in range(radial)]
    if name == 'Panelled athletic torso':
        angles = sorted(set(angles + [a % (2*math.pi) for center in (0, math.pi) for a in (center-.051, center-.024, center-.011, center-.004, center+.004, center+.011, center+.024, center+.051)]))
        radial = len(angles)
    for y, w, f, b, c in sections:
        for t in angles:
            s, co = math.sin(t), math.cos(t)
            x = math.copysign(abs(s) ** square * w, s)
            z = math.copysign(abs(co) ** square * (f if co >= 0 else b), co) + c
            verts.append(deform(x, y, z, t) if deform else (x, y, z))
    for i in range(len(sections)-1):
        for j in range(radial):
            a, n = i * radial + j, i * radial + (j + 1) % radial
            faces.append((a,n,n+radial,a+radial))
    faces.append(tuple(reversed(range(radial))))
    faces.append(tuple((len(sections)-1)*radial+j for j in range(radial)))
    return mesh(name, verts, faces, mat, parent, location, sub=sub)


def ellipsoid_shell(name, dimensions, mat, parent, location=(0,0,0)):
    x, y, z = dimensions
    return loft(name, [(-y*.5,.004,.004,.004,0),(-y*.38,x*.36,z*.36,z*.36,0),(0,x*.5,z*.5,z*.5,0),(y*.38,x*.36,z*.36,z*.36,0),(y*.5,.004,.004,.004,0)], mat, parent, location, radial=16, square=.7, sub=1)


def cylinder(name, radius, depth, mat, parent, location=(0,0,0), axis='x'):
    verts, faces, n = [], [], 20
    for end in (-depth*.5, depth*.5):
        for j in range(n):
            a = j/n*math.pi*2
            verts.append((end,radius*math.sin(a),radius*math.cos(a)) if axis=='x' else (radius*math.sin(a),end,radius*math.cos(a)))
    for j in range(n):
        faces.append((j,(j+1)%n,(j+1)%n+n,j+n))
    faces.append(tuple(reversed(range(n))))
    faces.append(tuple(n+j for j in range(n)))
    return mesh(name, verts, faces, mat, parent, location)


def catmull(points, steps=4):
    result = []
    ext = [points[0], *points, points[-1]]
    for i in range(1, len(ext)-2):
        a,b,c,d = [Vector(v) for v in ext[i-1:i+3]]
        for j in range(steps):
            t = j/steps
            result.append(tuple((b*2+(c-a)*t+(a*2-b*5+c*4-d)*t*t+(-a+b*3-c*3+d)*t*t*t)*.5))
    result.append(points[-1])
    return result


def mould_curve(name, points, radius, mat, parent, flatten=.7, steps=4):
    path = catmull(points, steps)
    verts, faces, n = [], [], 8
    for i, position in enumerate(path):
        tangent = Vector(path[min(i+1,len(path)-1)]) - Vector(path[max(0,i-1)])
        tangent.normalize()
        normal = tangent.cross(Vector((0,1,0)))
        if normal.length < .01:
            normal = tangent.cross(Vector((0,0,1)))
        normal.normalize()
        other = normal.cross(tangent).normalized()
        taper = .6 + .4*math.sin(math.pi*i/(len(path)-1))**.6
        for j in range(n):
            a = j/n*math.pi*2
            verts.append(tuple(Vector(position)+normal*math.cos(a)*radius*taper+other*math.sin(a)*radius*taper*flatten))
    for i in range(len(path)-1):
        for j in range(n):
            a,b = i*n+j,i*n+(j+1)%n
            faces.append((a,b,b+n,a+n))
    faces.append(tuple(reversed(range(n))))
    faces.append(tuple((len(path)-1)*n+j for j in range(n)))
    return mesh(name, verts, faces, mat, parent)


def solid_curl(name, center, normal, tangent, dimensions, mat, parent, phase=0):
    """Closed lobed curl mass: a shallow spiral groove is cut into a solid crown.
    There is no torus or tube path and no hole through the curl or its root.
    """
    normal, tangent = Vector(normal).normalized(), Vector(tangent).normalized()
    tangent = (tangent-normal*tangent.dot(normal)).normalized()
    bitangent = normal.cross(tangent).normalized()
    cx = Vector(center)
    w, h, d = dimensions
    verts, faces, columns, rows = [], [], 24, 12
    for k in range(rows+1):
        theta = math.pi*k/rows
        r = math.sin(theta)
        height = math.cos(theta)
        for j in range(columns):
            phi = 2*math.pi*j/columns
            outline = 1+.055*math.sin(phi*3+phase)+.025*math.cos(phi*5-phase)
            # Spiral relief, shallow enough to retain a dense opaque centre.
            groove = .23*math.exp(-((r-.54-.13*math.sin(phi+phase))/.11)**2)
            crown = height*(1-groove) if height>0 else height*.60
            tip = .025*math.sin(phi+phase)*r
            v = cx + tangent*(math.cos(phi)*r*w*outline) + bitangent*(math.sin(phi)*r*d*outline) + normal*(crown*h+tip*h)
            verts.append(tuple(v))
    for k in range(rows):
        for j in range(columns):
            a,b=k*columns+j,k*columns+(j+1)%columns
            faces.append((a,b,b+columns,a+columns))
    return mesh(name, verts, faces, mat, parent)


def swept_lock(name, path, widths, heights, mat, parent):
    """Broad, tapered closed mould, with a flatter root and a swept ridge.
    Each lock overlaps its neighbours; broad faces replace hollow rope curls.
    """
    points = catmull(path, 4)
    verts, faces, n = [], [], 16
    for i, pos in enumerate(points):
        u = i/(len(points)-1)
        q = u*(len(widths)-1)
        k = min(len(widths)-2, int(q))
        t = q-k
        width = widths[k]*(1-t)+widths[k+1]*t
        height = heights[k]*(1-t)+heights[k+1]*t
        tangent = Vector(points[min(i+1,len(points)-1)])-Vector(points[max(0,i-1)])
        tangent.normalize()
        normal = Vector((0,1,0))
        normal = (normal-tangent*normal.dot(tangent)).normalized()
        side = tangent.cross(normal).normalized()
        for j in range(n):
            a = 2*math.pi*j/n
            s, c = math.sin(a), math.cos(a)
            ridge = 1-.08*math.exp(-((abs(s)-.53)/.16)**2) if c>0 else .48
            offset = side*math.copysign(abs(s)**.58*width,s)+normal*math.copysign(abs(c)**.6*height*ridge,c)
            verts.append(tuple(Vector(pos)+offset))
    for i in range(len(points)-1):
        for j in range(n):
            a,b=i*n+j,i*n+(j+1)%n
            faces.append((a,b,b+n,a+n))
    faces.append(tuple(reversed(range(n))))
    faces.append(tuple((len(points)-1)*n+j for j in range(n)))
    return mesh(name, verts, faces, mat, parent)


TORSO = [(-.36,.252,.155,.151,0),(-.32,.272,.168,.161,0),(-.18,.286,.176,.172,0),(-.03,.325,.205,.196,0),(.08,.355,.237,.216,0),(.19,.404,.247,.239,0),(.32,.421,.251,.249,0),(.42,.414,.212,.219,0),(.49,.350,.181,.190,0),(.57,.224,.140,.159,0),(.64,.128,.119,.117,0),(.71,.126,.118,.116,0)]
HEAD = [(-.262,.086,.120,.085,.015),(-.240,.129,.166,.117,.006),(-.196,.180,.174,.148,0),(-.129,.203,.181,.171,0),(-.049,.218,.185,.188,0),(.030,.222,.182,.201,0),(.111,.219,.176,.203,0),(.187,.211,.165,.196,0),(.244,.187,.145,.168,0),(.294,.115,.090,.098,0),(.308,.015,.014,.014,0)]


def facial_depth(x, y):
    """Integrated facial relief: orbit recesses, brow and cheek ridges, nose and chin."""
    g = lambda value, center, spread: math.exp(-((value-center)/spread)**2)
    ax = abs(x)
    eye_y = .056 + .12*ax
    sockets = -.022*g(ax,.108,.055)*g(y,eye_y,.035)
    brow = .023*g(ax,.100,.071)*g(y,.115+.12*ax,.029)
    cheek = .027*g(ax,.158,.051)*g(y,-.018,.041)
    hollow = -.013*g(ax,.158,.046)*g(y,-.083,.049)
    bridge = .047*g(x,0,.029)*g(y,.035,.096)
    tip = .069*g(x,0,.038)*g(y,-.050,.026)
    nose_wing = .026*g(ax,.040,.019)*g(y,-.057,.017)
    philtrum = -.006*g(x,0,.012)*g(y,-.095,.020)
    lip = .010*g(x,0,.069)*g(y,-.132,.019)
    chin = .015*g(x,0,.098)*g(y,-.214,.025)
    return sockets+brow*1.2+cheek*1.15+hollow*1.3+bridge+tip+nose_wing+philtrum+lip+chin


def face_z(x, y):
    if FACE_SURFACE is not None:
        hit, normal, index, distance = FACE_SURFACE.ray_cast(Vector((x,y,.7)), Vector((0,0,-1)))
        if hit is not None:
            return hit.z
    w,f,b,c = section_interp(HEAD,y)
    sine = min(.995,(abs(x)/w)**(1/.47))
    base = (1-sine*sine)**(.47*.5)*f+c
    return base+facial_depth(x,y)


def printed_face(name, points, mat, parent, center=(0,0), offset=.005, local_pivot=False):
    # Subdivide each decal triangle and ray-project every vertex onto actual
    # tessellated skin. Large flat polygons otherwise disappear under brow relief.
    cx,cy = center
    depth = face_z(cx,cy)+offset if local_pivot else 0
    pivot=(cx,cy,depth) if local_pivot else (0,0,0)
    average=(sum(v[0] for v in points)/len(points),sum(v[1] for v in points)/len(points))
    verts,faces=[],[]
    def add(x,y):
        z=face_z(cx+x,cy+y)+offset
        verts.append((x,y,z-depth) if local_pivot else (cx+x,cy+y,z))
        return len(verts)-1
    for edge in range(len(points)):
        a,b,c=average,points[edge],points[(edge+1)%len(points)]
        grid={}
        steps=4
        for i in range(steps+1):
            for j in range(steps+1-i):
                u,v=i/steps,j/steps
                x=a[0]*(1-u-v)+b[0]*u+c[0]*v
                y=a[1]*(1-u-v)+b[1]*u+c[1]*v
                grid[i,j]=add(x,y)
        for i in range(steps):
            for j in range(steps-i):
                faces.append((grid[i,j],grid[i+1,j],grid[i,j+1]))
                if j<steps-i-1:
                    faces.append((grid[i+1,j],grid[i+1,j+1],grid[i,j+1]))
    o=mesh(name,verts,faces,mat,parent,pivot,smooth=False)
    o['printed']=True
    return o


def build(identity):
    global FACE_SURFACE
    FACE_SURFACE = None
    rival = identity != 'player'
    root = group('Rival' if rival else 'Player')
    body = group('Body',root,(0,1.46,0))
    hips = group('Hips',root,(0,1.16,0))
    head = group('Head',body,(0,.89,0))
    skin = mats['rival_skin' if rival else 'player_skin']
    hair = mats['brown' if rival else 'black']
    glove = mats['red' if rival else 'blue']
    cloth = mats['cream' if rival else 'dark']
    trim = mats['red']
    if identity == 'brick':
        skin = material('Bram bronze plastic', '#9e704e', .29)
        glove = material('Bram ochre gloves', '#bd8124', .24)
        cloth = mats['dark']; hair = mats['black']; trim = glove
    elif identity == 'encore':
        skin = material('Juno warm olive plastic', '#ba956f', .29)
        glove = material('Juno plum gloves', '#794b83', .24)
        hair = material('Juno ink quiff', '#29222c', .26)
        trim = glove
    def anatomy(x,y,z,t):
        front,back = max(0,math.cos(t)),max(0,-math.cos(t))
        ax = abs(x)
        # Broad mould planes bounded by sternum, lat and scapula valleys.
        pec = max(0,1-abs(ax-.205)/.188)*max(0,1-abs(y-.265)/.178)*.047
        sternum = math.exp(-(x/.033)**2)*max(0,1-abs(y-.23)/.30)*.024
        abs_plane = max(0,1-ax/.18)*max(0,1-abs(y+.04)/.27)*.017
        scap = max(0,1-abs(ax-.214)/.161)*max(0,1-abs(y-.275)/.206)*.066
        spine = math.exp(-(x/.031)**2)*max(0,1-abs(y-.17)/.37)*.056
        lat = max(0,1-abs(ax-.244)/.088)*max(0,1-abs(y-.012)/.207)*.018
        return (x,y,z+front*(pec-sternum+abs_plane)-back*(scap-spine+lat))
    loft('Panelled athletic torso',TORSO,skin,body,radial=48,square=.36,deform=anatomy,sub=1)
    cylinder('Neck articulation',.127,.128,skin,body,(0,.65,0),axis='y')
    # A dense continuous skin mesh carries all facial planes, including the nose.
    head_sections = []
    for i in range(35):
        y = HEAD[0][0]+(HEAD[-1][0]-HEAD[0][0])*i/34
        head_sections.append((y,*section_interp(HEAD,y)))
    def adult_head(x,y,z,t):
        return (x,y,z+facial_depth(x,y)*max(0,math.cos(t))**4)
    # Fine front sampling supports the integrated narrow bridge and orbit sculpt.
    verts,faces = [],[]
    angles = sorted(set([2*math.pi*j/64 for j in range(64)]+[v%(2*math.pi) for v in [-.055,-.035,-.019,-.008,.008,.019,.035,.055]]))
    count = len(angles)
    for y,w,f,b,c in head_sections:
        for t in angles:
            s,co = math.sin(t),math.cos(t)
            x = math.copysign(abs(s)**.47*w,s)
            z = math.copysign(abs(co)**.47*(f if co>=0 else b),co)+c
            verts.append(adult_head(x,y,z,t))
    for i in range(len(head_sections)-1):
        for j in range(count):
            a,b = i*count+j,i*count+(j+1)%count
            faces.append((a,b,b+count,a+count))
    faces.append(tuple(reversed(range(count))))
    faces.append(tuple((len(head_sections)-1)*count+j for j in range(count)))
    mesh('Integrated adult jaw cheek orbit and nose sculpt',verts,faces,skin,head)
    FACE_SURFACE = BVHTree.FromPolygons([Vector(v) for v in verts],faces)
    for sign in (-1,1):
        ellipsoid_shell('Ear '+str(sign),(.083,.142,.068),skin,head,(sign*.223,-.004,-.012))
        mould_curve('Ear inset '+str(sign),[(sign*.245,-.043,.018),(sign*.251,.002,.022),(sign*.244,.036,.016)],.004,mats['joint'],head)
        # Apertures follow recessed sockets and narrow toward the bridge.
        eye = [(-.040,.008),(-.026,.017),(.021,.008),(.038,-.006),(.020,-.013),(-.020,-.010)]
        eye = [(sign*x,y+sign*x*.12) for x,y in eye]
        printed_face('Focused eye ink '+str(sign),eye,mats['ink'],head,(sign*.105,.055))
        white = [(-.031,.004),(-.022,.017),(.020,.010),(.030,-.004),(.017,-.010),(-.021,-.007)]
        white = [(sign*x,y+sign*x*.12) for x,y in white]
        printed_face('Narrow eye white '+str(sign),white,mats['white'],head,(sign*.105,.055),.008)
        pupil = [(math.cos(i/16*math.pi*2)*.008,math.sin(i/16*math.pi*2)*.010) for i in range(16)]
        printed_face('Focused pupil '+str(sign),pupil,mats['ink'],head,(sign*.096,.057),.010)
        brows = [(-.070,-.010),(-.052,.015),(.051,.029),(.066,.012),(.043,.003),(-.027,-.003)]
        brows = [(sign*x,y) for x,y in brows]
        printed_face('BrowL' if sign < 0 else 'BrowR',brows,mats['ink'],head,(sign*.102,.116),.007,local_pivot=True)
        printed_face('Nostril '+str(sign),[(-.010,-.001),(-.004,.004),(.007,.003),(.009,-.003),(-.007,-.003)],mats['joint'],head,(sign*.030,-.065),.005)
        printed_face('Cheek sculpt accent '+str(sign),[(sign*-.015,.007),(sign*.012,-.008),(sign*.027,-.022),(sign*.021,-.023),(sign*-.005,-.004)],mats['joint'],head,(sign*.149,-.083),.005)
    printed_face('Mouth',[(-.062,-.012),(-.043,.006),(0,.013),(.043,.009),(.062,-.012),(.038,-.009),(0,.002),(-.039,-.009)],mats['ink'],head,(0,-.138),.007,local_pivot=True)
    # Tight scalp supports the solid locks and ends in a fitted broken nape edge.
    capverts,capfaces,radial,rows = [],[],48,14
    for row in range(rows+1):
        progress = row/rows
        for j in range(radial):
            t=j/radial*math.pi*2
            s,c=math.sin(t),math.cos(t)
            bottom=-.114+.30*((c+1)*.5)**1.7
            bottom+=.008*math.sin(t*7)
            y=bottom+(.318-bottom)*progress
            if y<=.294:
                w,f,b,center=section_interp(HEAD,y)
                w+=.009;f+=.009;b+=.010
            else:
                blend=(y-.294)/.024
                w=.126*(1-blend)+.006*blend
                f=.100*(1-blend)+.006*blend
                b=.108*(1-blend)+.006*blend
                center=0
            relief=.0025*math.sin(t*28+y*29)*(1-progress)
            x=math.copysign(abs(s)**.55*(w+relief),s)
            z=math.copysign(abs(c)**.55*((f if c>=0 else b)+relief),c)+center
            capverts.append((x,y,z))
    for row in range(rows):
        for j in range(radial):
            a,b=row*radial+j,row*radial+(j+1)%radial
            capfaces.append((a,b,b+radial,a+radial))
    capfaces.append(tuple(rows*radial+j for j in range(radial)))
    mesh('Fitted textured hair root',capverts,capfaces,hair,head)
    if not rival:
        # Three staggered wrap rows plus crown masses cover the broad rear cap.
        for row,(y,radius,number) in enumerate([(-.035,.209,9),(.086,.220,11),(.195,.188,10)]):
            for j in range(number):
                angle=(j+.37*(row%2))*2*math.pi/number
                co,si=math.cos(angle),math.sin(angle)
                if co>.50 and row<2:
                    continue
                center=(si*radius,y+.014*math.sin(j*2.7),co*radius*.91)
                normal=(si,.24 if row<2 else .54,co)
                tangent=(co,0,-si)
                solid_curl('Fitted black curl %d %02d'%(row,j),center,normal,tangent,(.072 if row<2 else .082,.033 if row==0 else .049,.069),hair,head,j*.61+row)
        # The rear is a dense overlapping sculpt field fitted to the actual
        # squarish skull, not a few round curls placed on a circular helmet.
        for row,y in enumerate((-.058,.033,.124,.215)):
            for j,x in enumerate((-.171,-.086,0,.086,.171)):
                xx=x+.009*math.sin(j*2.4+row)
                yy=y+.007*math.cos(j*1.7+row)
                w,f,b,c=section_interp(HEAD,yy)
                sine=min(.997,(abs(xx)/w)**(1/.47))
                z=-(1-sine*sine)**(.47*.5)*b+c-.016
                solid_curl('Interlocking rear black curl %d %d'%(row,j),(xx,yy,z),(xx*.9,.10,-1),(1,0,xx*.9),(.069+(j%2)*.009,.038,.066),hair,head,row*.8+j*.73)
        for j,(x,y,z,w,d) in enumerate([(-.132,.274,.093,.084,.078),(-.028,.305,.122,.086,.083),(.094,.286,.109,.091,.077),(-.117,.303,-.025,.090,.083),(.013,.328,-.003,.099,.085),(.134,.286,-.019,.079,.085),(-.096,.266,-.123,.086,.077),(.043,.288,-.112,.093,.083)]):
            solid_curl('Crown black curl %02d'%j,(x,y,z),(x*.7,1,z*.8),(1,-x*.7,0),(w,.055,d),hair,head,j*.72)
    elif identity != 'brick':
        # The asymmetric quiff consists of overlapping closed wedges swept back.
        locks=[
            ([(-.171,.187,.160),(-.137,.265,.194),(-.070,.330,.085),(.016,.298,-.071),(.070,.217,-.169)],[.032,.067,.072,.055,.012],[.024,.041,.042,.033,.010]),
            ([(-.094,.179,.192),(-.052,.261,.218),(.026,.381,.126),(.103,.348,-.028),(.144,.211,-.144)],[.040,.067,.064,.058,.012],[.025,.037,.046,.032,.010]),
            ([(-.003,.203,.185),(.061,.286,.201),(.127,.352,.099),(.179,.281,-.047),(.183,.166,-.119)],[.035,.061,.066,.047,.009],[.023,.039,.039,.027,.009]),
            ([(.077,.205,.155),(.147,.267,.153),(.202,.276,.037),(.207,.182,-.068)],[.035,.050,.043,.012],[.025,.034,.029,.009]),
            ([(-.211,.125,.071),(-.209,.228,.093),(-.146,.289,-.014),(-.051,.253,-.145),(.038,.164,-.202)],[.016,.052,.057,.048,.008],[.016,.030,.034,.029,.007]),
            ([(-.168,.061,-.139),(-.117,.159,-.199),(-.005,.195,-.212),(.114,.121,-.175),(.176,.052,-.094)],[.012,.046,.047,.039,.009],[.010,.025,.027,.022,.007]),
        ]
        for j,(path,widths,heights) in enumerate(locks):
            if identity == 'encore':
                path = [(x, y + .055 * max(0, (y - .2) / .18), z) for x, y, z in path]
            swept_lock('Solid asymmetric quiff ridge %02d'%j,path,widths,heights,hair,head)
    for sign in(-1,1):
        bevel_box('Fitted sideburn '+str(sign),(.026,.073,.024),hair,head,(sign*.213,.059,-.011),.008)
    bevel_box('Waist brief core',(.635,.147,.389),cloth,hips,(0,.016,0),.030)
    bevel_box('Ribbed waist belt',(.699,.112,.442),trim if rival else cloth,hips,(0,.105,0),.019)
    for x in [-.28,-.23,-.18,.18,.23,.28]:
        bevel_box('Belt mould rib',(.014,.094,.010),cloth,hips,(x,.105,-.224),.003)
    bevel_box('Belt crown patch',(.155,.088,.012),mats['cream'] if rival else mats['joint'],hips,(0,.105,.226),.006)
    verts=[(-.055,.072,.235),(-.055,.134,.235),(-.025,.104,.235),(0,.147,.235),(.025,.104,.235),(.055,.134,.235),(.050,.072,.235)]
    mesh('Waist crown print',verts,[tuple(range(7))],trim if rival else mats['white'],hips,smooth=False)
    for index,sign in enumerate((-1,1)):
        side='L' if index==0 else 'R'
        loft('Fitted deltoid plane '+side,[(-.127,.066,.064,.065,0),(-.089,.131,.121,.123,0),(.016,.155,.146,.149,0),(.099,.131,.119,.125,0),(.152,.038,.038,.039,0)],skin,body,(sign*.422,.430,-.001),radial=24,square=.55,sub=1)
        cylinder('Recessed shoulder socket '+side,.090,.025,mats['joint'],body,(sign*.423,.419,.002))
        upper=group('ArmUpper'+side,body)
        lower=group('ArmLower'+side,body)
        elbow=group('Elbow'+side,body)
        loft('Biceps triceps mould planes '+side,[(-.50,.65,.66,.66,0),(-.42,.76,.78,.78,0),(-.21,.99,1.13,.96,0),(.04,1.14,1.22,1.09,0),(.23,1.08,1.11,1.01,0),(.40,.88,.90,.87,0),(.50,.69,.71,.70,0)],skin,upper,radial=24,square=.54,sub=1)
        loft('Tapered forearm planes '+side,[(-.5,.67,.68,.67,0),(-.36,.77,.80,.73,0),(-.09,.98,1.02,.91,0),(.15,1.08,1.11,.98,0),(.35,.91,.94,.88,0),(.5,.69,.70,.69,0)],skin,lower,radial=24,square=.56,sub=1)
        cylinder('Inset elbow pivot '+side,.083,.039,mats['joint'],elbow)
        cylinder('Elbow inset skin pin '+side,.065,.044,skin,elbow)
        glove_group=group('Glove'+side,body,(sign*.34,.63,.39))
        group('Contact_'+side,glove_group,(0,.04,.27))
        loft('Padded shaped mitten '+side,[(-.19,.106,.108,.092,-.006),(-.115,.171,.200,.146,.016),(-.015,.210,.246,.163,.023),(.075,.216,.244,.167,.024),(.155,.205,.203,.151,.025),(.211,.122,.119,.104,.022),(.226,.047,.047,.041,.018)],glove,glove_group,radial=32,square=.59,sub=1)
        ellipsoid_shell('Integrated padded thumb '+side,(.140,.216,.177),glove,glove_group,(-sign*.165,-.048,.109))
        loft('Substantial printed wrist cuff '+side,[(-.080,.134,.119,.118,0),(-.065,.150,.133,.129,0),(.059,.151,.133,.131,0),(.077,.136,.122,.117,0)],mats['cream'],glove_group,(0,-.205,-.015),radial=24,square=.58,sub=1)
        for y in(-.266,-.141):
            loft('Cuff bound leather edge '+side,[(-.006,.151,.135,.132,0),(.006,.151,.135,.132,0)],glove,glove_group,(0,y,-.015),radial=24,square=.58,sub=0)
        bevel_box('Cuff printed broad band '+side,(.206,.061,.004),glove,glove_group,(0,-.203,.121),.006)
        for k in(-1,0,1):
            bevel_box('Cuff cream print '+side,(.024,.039,.003),mats['cream'],glove_group,(k*.052,-.203,.126),.003)
        mould_curve('Mitten thumb mould seam '+side,[(-sign*.136,-.101,.208),(-sign*.184,-.047,.213),(-sign*.160,.029,.216)],.0035,glove,glove_group)
        mould_curve('Glove lower compression mould '+side,[(-.097,-.103,.207),(-.044,-.074,.239),(0,-.083,.245),(.062,-.074,.228),(.110,-.099,.209)],.0028,glove,glove_group)
        leg_upper=group('LegUpper'+side,root)
        leg_lower=group('LegLower'+side,root)
        knee=group('Knee'+side,root)
        loft('Exposed athletic thigh '+side,[(-.5,.60,.63,.59,0),(-.41,.77,.81,.75,0),(-.23,.93,1.01,.88,0),(.02,1.08,1.14,1.03,0),(.26,1.12,1.15,1.06,0),(.44,.94,.94,.91,0),(.5,.70,.71,.69,0)],skin,leg_upper,radial=24,square=.59,sub=1)
        trunk_sections=[(-.38,1.025,1.06,1.02,0),(-.34,1.115,1.14,1.10,0),(-.08,1.135,1.18,1.13,0),(.24,1.10,1.15,1.11,0),(.46,.991,1.02,.98,0),(.49,.914,.94,.91,0)]
        loft('Reference length square trunk leg '+side,trunk_sections,cloth,leg_upper,radial=24,square=.20,sub=1)
        # Narrow stitched outer stripe follows the shaped shell, rather than a slab.
        stripeverts=[]
        for y,w,f,b,c in trunk_sections[1:-1]:
            stripeverts.extend([(sign*(w+.012),y,-b*.82),(sign*(w+.012),y,f*.82)])
        stripefaces=[(i*2,i*2+1,i*2+3,i*2+2) for i in range(3)]
        mesh('Fitted outer trunk stripe '+side,stripeverts,stripefaces,trim if rival else cloth,leg_upper,sub=1)
        if not rival:
            for x in(-.73,-.28,.28,.73):
                mould_curve('Subtle charcoal trunk mould '+side,[(x,-.084,-1.140),(x,.065,-1.188),(x,.29,-1.121)],.017,cloth,leg_upper)
        # Compact joint recess; the thigh and upper shin approach the pin itself.
        cylinder('Recessed knee pin '+side,.087,.040,mats['joint'],knee)
        cylinder('Knee skin pin '+side,.065,.046,skin,knee)
        loft('Angular kneecap '+side,[(-.057,.036,.015,.012,0),(-.033,.075,.033,.016,0),(.029,.081,.042,.017,0),(.057,.039,.023,.014,0)],skin,knee,(0,-.002,.058),radial=20,square=.43,sub=1)
        loft('Upper shin skin transition '+side,[(.16,.67,.70,.65,0),(.26,.71,.73,.68,0),(.39,.70,.73,.68,0),(.5,.62,.64,.61,0)],skin,leg_lower,radial=20,square=.60,sub=1)
        foot=group('Foot'+side,root,(sign*.245,.137,.24 if index==0 else -.17))
        boot=mats['cream'] if rival and identity != 'brick' else mats['dark']
        foot_sections=[(-.137,.113,.281,.121,.030),(-.103,.116,.278,.121,.030),(-.037,.115,.252,.119,.023),(.021,.105,.201,.117,.008),(.094,.088,.132,.104,-.020),(.158,.083,.103,.094,-.024)]
        loft('Coherent long boxing boot foot '+side,foot_sections,boot,foot,radial=28,square=.63,sub=1)
        loft('Shaped thin boxing sole '+side,[(-.137,.116,.284,.124,.030),(-.119,.118,.285,.125,.030)],mats['sole'],foot,radial=28,square=.60,sub=0)
        shaft_sections=[(-.555,.76,.83,.78,-.014),(-.45,.78,.86,.79,-.010),(-.24,.88,.98,.88,0),(-.04,.99,1.07,.95,0),(.15,1.00,1.05,.95,0),(.188,.95,1.01,.91,0)]
        loft('Fitted continuous boxing boot shaft '+side,shaft_sections,boot,leg_lower,radial=24,square=.59,sub=1)
        loft('Integrated narrow boot top binding '+side,[(-.009,1.009,1.061,.964,0),(.009,1.003,1.055,.956,0)],trim if rival else mats['cream'],leg_lower,(0,.154,0),radial=24,square=.59,sub=0)
        # Toe color is a fitted surface on the elongated toe, not a separate block.
        if rival:
            toe_verts=[]
            for y,w,f,b,c in foot_sections[:4]:
                for j in range(13):
                    t=-.96+j*1.92/12
                    toe_verts.append((math.copysign(abs(math.sin(t))**.63*w,math.sin(t)),y,abs(math.cos(t))**.63*f+c+.002))
            toe_faces=[]
            for k in range(3):
                for j in range(12):
                    a=k*13+j
                    toe_faces.append((a,a+1,a+14,a+13))
            mesh('Fitted scarlet toe panel '+side,toe_verts,toe_faces,mats['red'],foot,sub=1)
        for j in range(6):
            y=.102-j*.092
            w,f,b,c=section_interp(shaft_sections,y)
            z=f+c+.025
            mould_curve('Boot flat lace '+side+' '+str(j),[(-.31,y,z),(.31,y-.025,z)],.025,trim if rival else mats['cream'],leg_lower,flatten=.30,steps=1)
            if j<5:
                y2=y-.092
                w2,f2,b2,c2=section_interp(shaft_sections,y2)
                mould_curve('Boot crossing lace '+side+' '+str(j),[(.31,y-.025,z),(-.31,y2,f2+c2+.025)],.021,trim if rival else mats['cream'],leg_lower,flatten=.30,steps=1)
        for j in range(3):
            y=.027-j*.035
            mould_curve('Boot instep lace '+side+' '+str(j),[(-.048,y,.152+j*.029),(.048,y-.007,.152+j*.029)],.003,trim if rival else mats['cream'],foot,flatten=.35,steps=1)
    root['source']='Original authored visible-reference reconstruction; unseen surfaces interpreted'
    root['runtimeCoordinates']='Y up; native segment length 1; proximal end +Y'
    root['batch']='Completion pass 2026-10-05: reference length trunks and planar anatomy'
    return root


roots={identity:build(identity) for identity in ('player','rival','brick','encore')}


def set_segment(o,a,b,width):
    a,b=Vector(p(a)),Vector(p(b))
    delta=a-b
    o.location=(a+b)*.5
    o.rotation_mode='QUATERNION'
    o.rotation_quaternion=Vector((0,0,1)).rotation_difference(delta.normalized())
    o.scale=(width,width,delta.length)


def named(root,name):
    return next(o for o in root.children_recursive if o.name==name or o.name.startswith(name+'.'))


def rest_pose(root):
    for i,sign in enumerate((-1,1)):
        s='L' if i==0 else 'R'
        shoulder=(sign*.43,.45,.01)
        elbow=(sign*.49,.20,.34)
        wrist=(sign*.34,.63,.39)
        set_segment(named(root,'ArmUpper'+s),shoulder,elbow,.131)
        set_segment(named(root,'ArmLower'+s),elbow,wrist,.115)
        named(root,'Elbow'+s).location=p(elbow)
        hip=(sign*.225,1.105,0)
        knee=(sign*.242,.69,.12 if i==0 else -.06)
        ankle=(sign*.245,.29,.24 if i==0 else -.17)
        set_segment(named(root,'LegUpper'+s),hip,knee,.155)
        set_segment(named(root,'LegLower'+s),knee,ankle,.125)
        named(root,'Knee'+s).location=p(knee)


for root in roots.values():
    rest_pose(root)
def export_merged(root,identity):
    # Editable pieces stay independent in the .blend. Export static surfaces in
    # their parent's local frame per material to keep the draw-call budget fitted.
    bpy.context.view_layer.update()
    depsgraph=bpy.context.evaluated_depsgraph_get()
    buckets={}
    separate={'Mouth','BrowL','BrowR'}
    members=list(root.children_recursive)
    for o in members:
        canonical=o.name.rsplit('.',1)[0] if o.name[-3:].isdigit() else o.name
        if o.type!='MESH' or canonical in separate:
            continue
        key=(o.parent,o.data.materials[0],bool(o.get('printed')))
        buckets.setdefault(key,[]).append(o)
    assembled=[]
    for (parent,mat,printed),pieces in buckets.items():
        verts,faces,smooth,normals=[],[],[],[]
        for o in pieces:
            evaluated=o.evaluated_get(depsgraph)
            data=evaluated.to_mesh()
            first=len(verts)
            transform=o.matrix_local
            normal_matrix=transform.to_3x3().inverted().transposed()
            verts.extend(tuple(transform@v.co) for v in data.vertices)
            for poly in data.polygons:
                faces.append(tuple(first+i for i in poly.vertices))
                smooth.append(poly.use_smooth)
                normals.extend(tuple((normal_matrix@data.corner_normals[i].vector).normalized()) for i in poly.loop_indices)
            evaluated.to_mesh_clear()
        data=bpy.data.meshes.new('Export surfaces')
        data.from_pydata(verts,[],faces)
        data.materials.append(mat)
        data.update()
        for i,poly in enumerate(data.polygons):
            poly.use_smooth=smooth[i]
        data.normals_split_custom_set(normals)
        label=('printed ' if printed else 'Mould assembly ')+parent.name+' '+mat.name
        o=bpy.data.objects.new(label,data)
        bpy.context.collection.objects.link(o)
        o.parent=parent
        assembled.append(o)
    bpy.ops.object.select_all(action='DESELECT')
    root.select_set(True)
    for o in members:
        canonical=o.name.rsplit('.',1)[0] if o.name[-3:].isdigit() else o.name
        if o.type!='MESH' or canonical in separate:
            o.select_set(True)
    for o in assembled:
        o.select_set(True)
    bpy.context.view_layer.objects.active=root
    bpy.ops.export_scene.gltf(filepath=str(MODEL_DIR/(identity+'.glb')),export_format='GLB',use_selection=True,export_apply=True,export_extras=True,export_yup=True,export_materials='EXPORT')
    for o in assembled:
        data=o.data
        bpy.data.objects.remove(o,do_unlink=True)
        bpy.data.meshes.remove(data)


for identity,root in roots.items():
    if '--render-only' not in sys.argv:
        export_merged(root,identity)

# Save the clean editable two-rig source before the cheap studio evidence render.
roots['player'].location=p((-1.05,0,0))
roots['rival'].location=p((1.05,0,0))
scene=bpy.context.scene
world=bpy.data.worlds.new('Neutral studio')
scene.world=world
world.use_nodes=True
world.node_tree.nodes['Background'].inputs[0].default_value=(.12,.14,.17,1)
world.node_tree.nodes['Background'].inputs[1].default_value=.65
scene.render.engine='CYCLES'
scene.cycles.samples=8
scene.cycles.use_denoising=True
scene.render.threads_mode='FIXED'
scene.render.threads=2
scene.render.resolution_x=480
scene.render.resolution_y=600
scene.render.resolution_percentage=100
scene.view_settings.view_transform='AgX'
for name,loc,power,size in [('Key',(-3,5,4),600,4),('Fill',(4,3,2),400,4),('Rim',(1,4,-4),650,3)]:
    data=bpy.data.lights.new(name,'AREA')
    data.energy=power;data.shape='DISK';data.size=size
    o=bpy.data.objects.new(name,data)
    bpy.context.collection.objects.link(o)
    o.location=p(loc)
    o.rotation_euler=(Vector(p((0,1.4,0)))-o.location).to_track_quat('-Z','Y').to_euler()
camera_data=bpy.data.cameras.new('Asset review camera')
camera=bpy.data.objects.new('Asset review camera',camera_data)
bpy.context.collection.objects.link(camera)
scene.camera=camera
camera_data.type='ORTHO'
camera_data.ortho_scale=3.05
bpy.ops.wm.save_as_mainfile(filepath=str(SOURCE_DIR/'boxing-fighters.blend'))


def render_evidence(identity,root,heads=False):
    root.location=(0,0,0)
    head=named(root,'Head')
    visible=set([head,*head.children_recursive]) if heads else set([root,*root.children_recursive])
    for other in roots.values():
        for obj in [other,*other.children_recursive]:
            obj.hide_render=obj not in visible
    scene.render.resolution_x=400 if heads else 480
    scene.render.resolution_y=400 if heads else 600
    camera_data.ortho_scale=.82 if heads else 3.05
    target=(0,2.38,0) if heads else (0,1.38,0)
    for angle,label in [(0,'front'),(math.pi,'back'),(.65,'three-quarter')]:
        camera.location=p((math.sin(angle)*5,2.47 if heads else 1.65,math.cos(angle)*5))
        camera.rotation_euler=(Vector(p(target))-camera.location).to_track_quat('-Z','Y').to_euler()
        filename=identity+('-head-' if heads else '-')+label+'.png'
        imagepath=RENDER_DIR/filename
        scene.render.filepath=str(imagepath)
        bpy.ops.render.render(write_still=True)
        provenance={'source':'tools/build-fighters.py','kind':'Offline Blender studio verification render','model':'public/models/'+identity+'.glb','view':filename[:-4],'reference':['.impeccable/mocks/01-ringside-flash.png','.impeccable/mocks/02-fight-club-zine.png'],'createdAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'runtimeAsset':False,'batch':'rebuild material fixes 1-5','resolution':[scene.render.resolution_x,scene.render.resolution_y]}
        Path(str(imagepath)+'.json').write_text(json.dumps(provenance,indent=2)+'\n')
        out=EVIDENCE_DIR/('completion-asset-'+filename)
        shutil.copyfile(imagepath,out)
        Path(str(out)+'.json').write_text(json.dumps({**provenance,'copiedFrom':str(imagepath.relative_to(ROOT))},indent=2)+'\n')


if '--render=none' not in sys.argv:
    for identity,root in roots.items():
        if '--render=rival' in sys.argv and identity!='rival':
            continue
        if '--render=heads' not in sys.argv:
            render_evidence(identity,root)
        render_evidence(identity,root,heads=True)
for identity,root in roots.items():
    root.location=p((-1.05 if identity=='player' else 1.05,0,0))
    for obj in [root,*root.children_recursive]:
        obj.hide_render=False
camera_data.ortho_scale=4.25
camera.location=p((3.3,2.8,5))
camera.rotation_euler=(Vector(p((0,1.42,0)))-camera.location).to_track_quat('-Z','Y').to_euler()
scene.render.resolution_x=960
scene.render.resolution_y=720
bpy.ops.wm.save_as_mainfile(filepath=str(SOURCE_DIR/'boxing-fighters.blend'))


def glb_stats(path):
    data=path.read_bytes()
    length,kind=struct.unpack_from('<II',data,12)
    assert kind==0x4e4f534a
    content=json.loads(data[20:20+length])
    triangles=sum(content['accessors'][primitive['indices']]['count']//3 for model in content['meshes'] for primitive in model['primitives'])
    return {'path':str(path.relative_to(ROOT)),'bytes':len(data),'triangles':triangles,'meshCount':len(content['meshes']),'sha256':hashlib.sha256(data).hexdigest()}


manifest={'source':'tools/build-fighters.py','editableSource':'assets/models/boxing-fighters.blend','reference':['.impeccable/mocks/01-ringside-flash.png','.impeccable/mocks/02-fight-club-zine.png'],'assets':{identity:glb_stats(MODEL_DIR/(identity+'.glb')) for identity in roots},'blenderVersion':bpy.app.version_string,'reviewImages':'.impeccable/review/completion-models/completion-asset-{identity}-{front,back,three-quarter,head-front,head-back,head-three-quarter}.png','runtimeRasterTextures':0,'exportStrategy':'Evaluated static meshes merged by rig parent/material; editable parts retained in Blender; Mouth/BrowL/BrowR separate; facial surfaces keep printed prefix','reviewResolution':{'body':[480,600],'head':[400,400],'samples':8,'threads':2},'note':'Original authored meshes; reconstruct visible identity rather than claiming supplied source geometry. Studio images are evidence only.','rebuild':'Closed fitted curl masses; low solid asymmetric quiff; integrated brow/orbit/cheek/nose/jaw sculpt and narrow focused eye prints; muscle planes and inset pivots; longer square reference trunks with fitted side stripe; fitted long boots and padded gloves with substantial bound cuffs.'}
(SOURCE_DIR/'PROVENANCE.json').write_text(json.dumps(manifest,indent=2)+'\n')
print('FIGHTER_ASSETS_READY '+json.dumps(manifest),flush=True)
