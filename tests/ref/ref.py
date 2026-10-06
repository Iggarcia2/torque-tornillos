# tests/ref/ref.py
"""Implementación independiente (Python) del mismo modelo, con las tablas reescritas aparte.
Compara contra las salidas del núcleo JS sobre casos pseudoaleatorios."""
import json, math, sys, os

KSI = 6.894757293168361
IN = 25.4
t30 = math.tan(math.radians(30))

# --- clases: (Rm, Rp, Sp) por tramo [(hasta_mm, Rm, Rp, Sp)] ; ref
def ksi(x): return x * KSI
CL = {
 '4.6':  dict(fam='acero', ref='Sp', tr=[(39, 400, 240, 225)]),
 '5.8':  dict(fam='acero', ref='Sp', tr=[(39, 520, 420, 380)]),
 '8.8':  dict(fam='acero', ref='Sp', tr=[(16, 800, 640, 580), (39, 830, 660, 600)]),
 '10.9': dict(fam='acero', ref='Sp', tr=[(39, 1040, 940, 830)]),
 '12.9': dict(fam='acero', ref='Sp', tr=[(39, 1220, 1100, 970)]),
 'A2-70': dict(fam='inox', ref='Rp', tr=[(24, 700, 450, None)]),
 'A2-80': dict(fam='inox', ref='Rp', tr=[(24, 800, 600, None)]),
 'A4-70': dict(fam='inox', ref='Rp', tr=[(24, 700, 450, None)]),
 'A4-80': dict(fam='inox', ref='Rp', tr=[(24, 800, 600, None)]),
 'SAE2': dict(fam='acero', ref='Sp', tr=[(0.75*IN, ksi(74), ksi(57), ksi(55)), (1.5*IN, ksi(60), ksi(36), ksi(33))]),
 'SAE5': dict(fam='acero', ref='Sp', tr=[(1.0*IN, ksi(120), ksi(92), ksi(85)), (1.5*IN, ksi(105), ksi(81), ksi(74))]),
 'SAE8': dict(fam='acero', ref='Sp', tr=[(1.5*IN, ksi(150), ksi(130), ksi(120))]),
}
MAT = {  # Rm, pG, regla
 'acero_s235': (360, 490, 1.0), 'acero_s355': (470, 710, 1.0), 'fundicion_gris': (250, 900, 1.5), 'fundicion_nodular': (500, 700, 1.25),
 'aluminio_6061': (290, 350, 2.0), 'aluminio_fundido': (230, 250, 2.0), 'bronce': (270, 280, 1.5), 'plastico_gf': (100, 100, 2.5),
 'plastico': (50, 60, 3.0), 'personalizado': (None, None, 1.5),
}
LUB = {  # K, Kmin, Kmax
 'seca': (0.20, 0.15, 0.25), 'aceitada': (0.15, 0.12, 0.18), 'cincada': (0.20, 0.15, 0.25), 'galvanizada': (0.25, 0.20, 0.30),
 'antiengrane': (0.13, 0.10, 0.16), 'loctite': (0.18, 0.14, 0.22),
}
LUB_INOX_SECA = (0.30, 0.24, 0.36)

def rosca(id_, serie):
    if serie == 'gruesa':
        P = {3:.5,4:.7,5:.8,6:1,8:1.25,10:1.5,12:1.75,14:2,16:2,18:2.5,20:2.5,22:2.5,24:3,27:3,30:3.5,33:3.5,36:4,39:4}
        D = int(id_[1:]); return 'metrica', float(D), P[D]
    if serie == 'fina':
        D, p = id_[1:].split('x'); return 'metrica', float(D), float(p)
    frac, tpi = id_.rsplit('-', 1)[0], None
    # id tipo '1/2-13UNC' o '1-1/8-7UNC'
    base = id_[:-3]
    partes = base.rsplit('-', 1)
    nombre, tpi = partes[0], int(partes[1])
    if '-' in nombre:
        ent, fr = nombre.split('-'); num, den = fr.split('/'); din = int(ent) + int(num) / int(den)
    elif '/' in nombre:
        num, den = nombre.split('/'); din = int(num) / int(den)
    else:
        din = float(nombre)
    return 'unificada', din * IN, IN / tpi

def calc(c):
    sis, D, P = rosca(c['rosca'], c['serie'])
    cl = CL[c['claseId']]
    tr = cl['tr'][-1]
    for t in cl['tr']:
        if D <= t[0] + 1e-6: tr = t; break
    _, Rm, Rp, Sp = tr
    d2 = D - 3 * math.sqrt(3) / 8 * P
    d3 = D - 17 * math.sqrt(3) / 24 * P
    D1 = D - 5 * math.sqrt(3) / 8 * P
    ds = (d2 + d3) / 2 if sis == 'metrica' else D - 0.9743 * P
    As = math.pi / 4 * ds ** 2
    ref = Sp if cl['ref'] == 'Sp' else Rp
    Fref = ref * As; Fobj = c['pct'] / 100 * Fref
    RmM, pG, regla = MAT[c['materialId']]
    if c['materialId'] == 'personalizado': RmM = c['rm']; pG = 1.3 * RmM
    # barrido
    w_int = P / 2 + (D - d2) * t30          # espesor del diente interior en el cilindro D
    w_ext = P / 2 + (d2 - D1) * t30         # espesor del diente exterior en el cilindro D1
    Le = c['fLe'] * D
    Fult = Rm * As
    cInt = 0.8 * 0.6 * RmM * math.pi * D * w_int / P
    cExt = 0.8 * 0.6 * Rm * math.pi * D1 * w_ext / P
    Fstrip = min(cInt, cExt) * Le
    Lean = max(Fult / cInt, Fult / cExt)
    Lerec = math.ceil(max(Lean, regla * D) * 2 - 1e-9) / 2
    est = 'ok'
    if Le < Lean - 1e-9: est = 'peligro'
    elif Le < regla * D - 1e-9: est = 'aviso'
    # cabeza
    dw = (1.9 if c['arandela'] else 1.45) * D; dh = 1.1 * D
    Ab = math.pi / 4 * (dw**2 - dh**2)
    Fcab = pG * Ab
    Frosca = Fstrip / 1.5
    Fapl = min(Fobj, Frosca, Fcab)
    lim = None
    if Fapl < Fobj * (1 - 1e-9): lim = 'rosca' if Frosca <= Fcab else 'cabeza'
    K = LUB[c['lubId']]
    if cl['fam'] == 'inox' and c['lubId'] == 'seca': K = LUB_INOX_SECA
    Tn = K[0] * D / 1000 * Fapl
    return dict(As=As, Fobj=Fobj, Fapl=Fapl, Tmin=K[1]*D/1000*Fapl, Tnom=Tn, Tmax=K[2]*D/1000*Fapl, Tobj=K[0]*D/1000*Fobj, Lereq=Lean, Lerec=Lerec,
                Fstrip=Fstrip, estBarrido=est, limitante=lim, Ab=Ab, pctMax=Fapl*K[0]/K[1]/Fref*100)

casos = json.load(open(os.path.join(os.path.dirname(__file__), 'casos.json')))
maxerr = {}; malos = 0
for c in casos:
    r = calc(c); js = c['js']
    for k, v in r.items():
        if isinstance(v, str) or v is None:
            if v != js[k]:
                malos += 1
                if malos < 10: print('DIFERENCIA', k, c['rosca'], c['claseId'], c['materialId'], c['lubId'], 'py=', v, 'js=', js[k])
        else:
            e = abs(v - js[k]) / max(abs(v), 1e-12)
            maxerr[k] = max(maxerr.get(k, 0), e)
            if e > 1e-5:
                malos += 1
                if malos < 10: print('DIFERENCIA', k, c['rosca'], c['claseId'], c['materialId'], 'py=', v, 'js=', js[k], 'err', e)
print('casos comparados:', len(casos))
print('error relativo máximo por magnitud:', {k: '%.2e' % v for k, v in maxerr.items()})
print('diferencias:', malos)
import collections
print('limitantes:', collections.Counter(c['js']['limitante'] for c in casos), ' estados:', collections.Counter(c['js']['estBarrido'] for c in casos))
sys.exit(1 if malos else 0)
