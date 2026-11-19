"""Original vector teaching diagrams. Boxes are process concepts, not instrument photos."""
from pathlib import Path
from html import escape
import textwrap
out=Path('assets/course');out.mkdir(exist_ok=True)
def text(x,y,s,size=28,color='#123e52',weight='normal',anchor='start'):
 return f'<text x="{x}" y="{y}" font-size="{size}" fill="{color}" font-weight="{weight}" text-anchor="{anchor}">{escape(s)}</text>'
def lines(x,y,s,width=22,size=27,step=38):
 return ''.join(text(x,y+i*step,line,size) for i,line in enumerate(textwrap.wrap(s,width)))
def box(x,y,w,h,label,sub='',color='#edf6f8'):
 return f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="16" fill="{color}" stroke="#087b85" stroke-width="3"/>'+lines(x+20,y+45,label,max(10,int(w/16)),27)+ (lines(x+20,y+h-55,sub,max(12,int(w/14)),22,29) if sub else '')
def arrow(x1,y1,x2,y2):
 return f'<path d="M{x1} {y1} L{x2} {y2}" fill="none" stroke="#087b85" stroke-width="5" marker-end="url(#arr)"/>'
def save(name,title,body,desc):
 header=f'<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="560" viewBox="0 0 1200 560" role="img" aria-labelledby="t d"><title id="t">{escape(title)}</title><desc id="d">{escape(desc)}</desc><defs><marker id="arr" markerWidth="10" markerHeight="10" refX="8" refY="4" orient="auto"><path d="M0 0 L0 8 L9 4z" fill="#087b85"/></marker></defs><rect width="1200" height="560" fill="white"/><g font-family="Arial,sans-serif">'
 (out/(name+'.svg')).write_text(header+text(45,55,title,34,weight='bold')+body+'</g></svg>')
def flow(name,title,labels,subs,foot):
 w=(1120-45*(len(labels)-1))/len(labels);body=''
 for i,(label,sub) in enumerate(zip(labels,subs)):
  x=40+i*(w+45);body+=box(x,155,w,230,label,sub)
  if i<len(labels)-1:body+=arrow(x+w+8,270,x+w+37,270)
 body+=lines(50,465,foot,83,27,38)
 save(name,title,body,foot)
flow('measurement-chain','Trace the claim back to the sample',
 ['Question','Sample','Prepared solution','Recorded signal'],
 ['What quantity?','Which place and time?','What chemical treatment?','What calibration?'],
 'The result applies to a defined material under a defined procedure; the signal alone does not define the measurand.')
save('measurand','Define a quantity before measuring it',
 box(60,130,500,135,'Analyte and matrix','Chloride in supplied filtered water')+
 box(640,130,500,135,'Material and scope','Collected location and sampling time')+
 box(60,315,500,135,'Quantity and unit','Mass concentration: mg chloride/L')+
 box(640,315,500,135,'Procedure and conditions','Filtration changes the material measured'),
 'Four parts of a measurand: analyte and matrix, material scope, quantity and unit, and procedure.')
save('selectivity','The same sample supports different questions',
 box(50,155,310,240,'Water sample','Cl⁻, Na⁺, Ca²⁺, other ions')+arrow(385,270,510,195)+arrow(385,290,510,390)+
 box(540,115,600,150,'Chloride-selective procedure','Aims at a particular chemical quantity')+
 box(540,335,600,150,'Conductivity measurement','Responds to several mobile ionic species'),
 'A selective chloride procedure and conductivity do not have the same measurand.')
flow('mass-concentration','Amount and concentration answer different questions',
 ['Mass: 5.00 mg','Volume: 0.250 L','Concentration: 20.0 mg/L'],
 ['Amount of chloride','Amount of solution','Mass divided by volume'],
 'Taking a larger volume increases the collected mass at unchanged concentration, assuming a homogeneous solution.')
# Stratified material with physical positions.
body='<rect x="110" y="115" width="360" height="360" fill="#edf6f8" stroke="#087b85" stroke-width="4"/>'
for i,(label,c) in enumerate([('Top: 8 mg/kg','#d8edf0'),('Middle: 14 mg/kg','#b3d6db'),('Bottom: 25 mg/kg','#74b3bd')]):
 body+=f'<rect x="112" y="{117+120*i}" width="356" height="118" fill="{c}"/>'+text(145,185+120*i,label,27)
for i in range(3):
 body+=arrow(485,175+i*120,620,175+i*120)
body+=box(660,135,470,300,'Sample all defined strata','Equal masses here: overall mean 15.67 mg/kg')
body+=text(75,525,'Several precise top-only measurements still miss the lower material.',27)
save('strata','Represent the material, not the convenient part',body,'Equal-mass top, middle and bottom strata have different iron concentrations. Top-only sampling is biased.')
flow('extraction-chain','Work backwards through every preparation step',
 ['0.5000 g material','25.00 mL extract','2.00 mL aliquot','10.00 mL final'],
 ['Mass basis','Total extraction volume','Fraction of extract','1.92 mg caffeine/L'],
 '1.92 × (10/2) × 0.025 = 0.240 mg extracted caffeine; 0.240 / 0.5000 = 0.480 mg/g.')
save('partition','Partitioning moves analyte; it does not create it',
 '<rect x="100" y="120" width="400" height="320" fill="#e0f2f3" stroke="#087b85" stroke-width="3"/>'+
 '<rect x="102" y="122" width="396" height="130" fill="#fde5d5"/>'+text(140,180,'Extracting phase: 10 mL',27)+text(140,225,'Concentration = 9 × c aqueous',24)+
 text(140,325,'Aqueous phase: 20 mL',27)+text(140,375,'Concentration = c aqueous',24)+
 arrow(540,255,680,255)+box(720,145,410,260,'Ideal equilibrium: D = 9','Recovered fraction = 90 / 110 = 81.8%')+
 text(70,515,'Assume immiscible phases, constant volumes and no chemical change.',26),
 'Two immiscible phases share analyte at distribution ratio nine. The organic ten millilitres holds 81.8 percent of the mass.')
save('preservation','The bottle contents can change before measurement',
 box(55,145,330,260,'Chemical change','Oxidation or precipitation', '#fde5d5')+
 box(435,145,330,260,'Surface transfer','Adsorption to the container')+
 box(815,145,330,260,'Biological change','Growth or consumption')+
 lines(65,480,'Preservation must fit the measurand and method. A treatment that preserves an element can change its chemical form.',84,26),
 'Storage can change composition by reactions, adsorption or biological processes. Preservation is method dependent.')
flow('uncertainty-chain','Some effects are shared by all repeat readings',
 ['Stock standard','Prepared aliquot','Repeated readings'],
 ['Shared concentration uncertainty','Shared volume and recovery','Additional reading noise'],
 'Averaging repeated readings reduces independent reading noise; it does not remove a common stock or preparation effect.')
save('quality-materials','Blank, independent check and spike ask different questions',
 box(45,140,340,285,'Method blank','Does the procedure introduce analyte?')+
 box(430,140,340,285,'Independent check','Does the calibration recover a known quantity?')+
 box(815,140,340,285,'Sample spike','How does this matrix respond to added analyte?')+
 text(60,505,'One successful check does not replace the others.',28),
 'A blank, independent reference check and a sample spike examine different parts of the measurement.')
# Physical titration sketch.
body='<path d="M245 110 L295 110 L295 300 L270 335 L270 370" fill="none" stroke="#087b85" stroke-width="5"/>'
for y in range(130,290,25):body+=f'<line x1="247" y1="{y}" x2="265" y2="{y}" stroke="#123e52" stroke-width="2"/>'
body+='<path d="M220 380 L320 380 L320 420 L390 490 L150 490 L220 420 Z" fill="#edf6f8" stroke="#087b85" stroke-width="4"/>'
body+=text(355,150,'Standardised titrant',30)+text(355,200,'Delivered volume = final − initial',28)+text(355,270,'Known sample aliquot',30)+text(355,320,'Indicator or electrode detects an endpoint',26)
body+=box(650,380,490,130,'Stoichiometry converts amount','Endpoint estimates equivalence')
save('burette','A titration combines known concentration and volume',body,'A burette delivers standardised titrant to a known sample aliquot. Endpoint detection estimates the stoichiometric equivalence point.')
flow('edta-complex','One metal ion consumes one EDTA molecule',
 ['Ca²⁺ or Mg²⁺','EDTA ligand','Metal–EDTA complex'],
 ['Accessible in the sample','Protonation depends on pH','1:1 metal-to-ligand stoichiometry'],
 'Buffer and indicator support the selected titration. Hardness as CaCO₃ is an equivalent reporting basis, not a claim that CaCO₃ was dissolved.')
# High input impedance measurement loop.
body='<path d="M90 240 L90 460 L710 460 L710 240" fill="#edf6f8" stroke="#087b85" stroke-width="4"/>'
body+='<path d="M220 300 L220 120 L470 120 L470 300 M570 300 L570 120" fill="none" stroke="#123e52" stroke-width="4"/>'
body+=box(345,80,280,100,'High-impedance meter')+text(120,510,'Same sample solution',28)
body+=text(775,220,'Indicator electrode',28)+text(775,265,'Selective membrane response',23)+text(775,355,'Reference electrode',28)+text(775,400,'Stable potential and junction',23)
body+=arrow(750,240,590,310)+arrow(750,365,240,330)
save('electrode-cell','Potential is measured between two electrodes',body,'An indicator electrode and reference electrode contact the same sample and connect to a high-input-impedance meter. There is negligible net measurement current.')
save('activity','An electrode responds to activity',
 box(60,145,500,270,'Concentration c','Amount per solution volume')+
 box(650,145,490,270,'Activity a = γ c / c°','Effective thermodynamic composition')+
 text(65,480,'Matching ionic-strength conditions helps a concentration calibration transfer.',27)+
 text(65,525,'Interfering ions and liquid-junction changes can still affect the response.',25),
 'Activity is dimensionless and related to concentration by an activity coefficient and standard concentration. Matching ionic strength supports calibration transfer.')
# Equal flasks and sample fraction.
body=''
for i,added in enumerate([0,.5,1,1.5,2]):
 x=70+225*i
 body+=f'<path d="M{x+55} 150 L{x+95} 150 L{x+95} 245 L{x+155} 365 L{x-5} 365 L{x+55} 245 Z" fill="#edf6f8" stroke="#087b85" stroke-width="3"/>'
 body+=text(x-10,420,f'+{added:.1f} mg/L',26)+text(x-5,460,'in final flask',21)
body+=text(55,110,'Every flask: 10.00 mL sample made to 25.00 mL total',28)+text(55,525,'Vary the added standard; keep the sample fraction and final volume fixed.',27)
save('addition-flasks','Standard addition keeps the matrix fraction constant',body,'Five flasks have equal sample aliquots and equal final volume, but increasing standard additions expressed as final-flask concentration.')
flow('recovery-timing','When you spike determines what you test',
 ['Before extraction','After extraction','Before injection'],
 ['Extraction and later effects','Matrix response and later effects','Injection and detector effects'],
 'Added analyte may not behave like native bound analyte. A successful late spike cannot establish complete extraction of native material.')
flow('aas-path','Atomic absorption measures attenuation of source light',
 ['Element lamp','Atomiser','Wavelength selection','Detector'],
 ['Element-specific source','Free atoms absorb','Isolate the target line','Compare transmitted light'],
 'The sample must be converted into an appropriate free-atom population; flame and graphite furnace differ in how this is achieved.')
flow('icp-path','ICP optical emission measures light produced by the sample',
 ['Nebuliser / aerosol','Plasma','Spectrometer','Detector'],
 ['Introduce sample','Atomise and excite','Separate emission wavelengths','Record line intensity'],
 'Elemental emission does not preserve the original molecular identity or oxidation-state distribution of the sample.')
save('atomic-transitions','Absorption and emission reverse the energy change',
 '<path d="M100 180 L470 180 M100 410 L470 410 M730 180 L1100 180 M730 410 L1100 410" stroke="#123e52" stroke-width="4"/>'+
 arrow(280,390,280,195)+arrow(910,195,910,390)+text(110,125,'Absorption',32)+text(735,125,'Emission',32)+
 text(70,465,'Atom gains energy from light',26)+text(705,465,'Excited atom releases light',26)+text(65,530,'The photon energy matches the difference between allowed states.',28),
 'Absorption moves an atom from lower to higher energy, while emission releases a photon during a transition from higher to lower energy.')
save('atomisers','Different atomisers create different measurement conditions',
 box(45,140,340,290,'Flame AAS','Continuous introduction; selected elements')+
 box(430,140,340,290,'Graphite furnace AAS','Small aliquot; programmed heating')+
 box(815,140,340,290,'ICP optical emission','Plasma excitation; many emission lines')+
 text(60,505,'Sensitivity, matrix effects, throughput and sample volume all affect method choice.',25),
 'Flame AAS, graphite furnace AAS and ICP optical emission differ in introduction, atomisation and detection conditions.')
save('column-bands','Retention separates migrating sample bands',
 '<rect x="80" y="150" width="1040" height="220" rx="35" fill="#edf6f8" stroke="#087b85" stroke-width="4"/>'+
 '<rect x="340" y="155" width="70" height="210" fill="#c35420" opacity=".8"/><rect x="680" y="155" width="100" height="210" fill="#087b85" opacity=".8"/>'+
 arrow(120,430,1080,430)+text(380,485,'Mobile phase moves towards the detector',28)+text(320,115,'More retained band',27)+text(675,115,'Less retained band',27)+
 text(80,535,'This is one snapshot inside a column; the detector sees peaks over time.',26),
 'A snapshot shows two separated bands moving through a column. The less retained band is further towards the outlet; time-resolved detection gives peaks.')
save('chrom-partition','Repeated exchange controls the average migration speed',
 box(70,125,1060,145,'Mobile phase: carries solute along the column','A solute moves while it occupies the mobile phase')+
 box(70,345,1060,145,'Stationary phase: retains solute','Longer residence gives slower average migration')+
 arrow(350,290,350,330)+arrow(850,330,850,290),
 'Solutes repeatedly exchange between mobile and stationary phases. A greater stationary-phase residence fraction delays average migration.')
flow('gc-instrument','GC transports vapour through a heated column',
 ['Carrier gas','Inlet','Column in oven','Detector'],
 ['Mobile phase','Vaporise a small sample','Separation by interactions and volatility','Signal versus time'],
 'The analyte must tolerate introduction and separation conditions. Oven temperature programming changes retention during the run.')
flow('hplc-instrument','HPLC pumps liquid through a column',
 ['Solvent reservoirs','Pump / injector','Packed column','Detector'],
 ['Mobile-phase composition','Controlled flow; introduce sample','Separation by interactions','Signal versus time'],
 'In reversed-phase HPLC, changing organic modifier often changes retention. Re-equilibrate before the next injection.')
flow('internal-standard','An internal standard follows selected sources of variation',
 ['Add a known amount','Measure both peaks','Calibrate area ratio'],
 ['Same final concentration in this example','Analyte and standard must be resolved','Shared injection effects can cancel'],
 'The ratio cannot repair coelution, analyte loss before standard addition, or different behaviour of analyte and standard.')
flow('mass-spectrometer','A mass spectrometer measures ions, not neutral mass directly',
 ['Ion source','Mass analyser','Detector'],
 ['Make gas-phase ions','Separate or filter m/z','Record ion abundance'],
 'For a singly protonated molecule, [M+H]⁺ is about one mass unit above neutral M. Fragments and multiple charges require interpretation.')
save('method-choice','Choose a method that answers the chemical question',
 box(55,130,500,150,'Element amount','Atomisation + elemental detection')+
 box(645,130,500,150,'Molecular identity and amount','Separation + suitable detection')+
 box(55,340,500,150,'Bulk reactive quantity','Stoichiometric titration, if selective enough')+
 box(645,340,500,150,'Ion activity under conditions','Selective electrode + reference system'),
 'Different analytical questions call for elemental detection, molecular separation, titration or ion-activity measurement.')
print('Wrote',len(list(out.glob('*.svg'))),'course figures including existing plots')

flow('atomic-preparation','Copper: follow the dry mass and both solution volumes',
 ['0.2500 g dry sample','50.00 mL digest','Twofold dilution','Emission reading'],
 ['Original mass basis','Subtract method blank here','Undo this factor first','Calibrate mg Cu/L'],
 'A1: (0.40189 × 2 − 0.001992) mg/L × 0.05000 L / 0.0002500 kg = 160.36 mg/kg dry mass.')
flow('dilution-stock','Uncertainty follows the dilution inputs',
 ['100.0 mg/L stock','5.000 mL aliquot','50.00 mL final'],
 ['u = 0.4 mg/L','u = 0.006 mL','u = 0.03 mL'],
 'Model: c final = c stock × V aliquot / V final. Result = 10.00 mg/L; input uncertainties are standard uncertainties.')
flow('drink-preparation','A newly measured dilution supports the drink result',
 ['Drink B','C3: new 2.00 mL aliquot','50.00 mL final','16 mg/L measured'],
 ['Original measurand','New preparation, not edited C2','Total volume includes solvent','Multiply by factor 25'],
 'C3 supports 400 mg caffeine/L original under the stated conditions. The old out-of-range C2 reading remains unsupported.')
