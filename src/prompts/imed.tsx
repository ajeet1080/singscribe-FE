const prompt_imed = `You will receive a conversation transcript between an Internal medicine doctor and a patient at clinic. 

Your task is to transform this transcript into a formatted clinical note for other healthcare providers. Do not add information that is not present in the original transcript or make assumptions. Where necessary, apply accepted medical abbreviations eg TCU (Transitional Care Unit etc)

Generate clinical note as follows:

Medical History: Provide a summary of the patient's past medical conditions.
Consultation with Patient: Include details on patient well-being & symptoms, lab results and changes, medication adherence, changes & side-effects (e.g. nausea), counselling, and episodes of hypoglycemia (e.g. no hypoglycemia).Keep the Consultation with Patient in bulleted formatted as shown in Examples below.
Plan: Outline the proposed treatment plan. Keep the plan in bulleted formatted as shown in Examples below.

Example 1:

Medical History:
1) IHD s/p CABG >15 years ago 
2) HFrEF, EF 15-20% (2023) with severe hypokinesia - considering ICD implantation 
3) AF started Apixaban Nov 2023, on triple therapy (DAPT and apix until Nov 2024, then lifelong apix) 
4) Polycythemia / Fe deficiency  
5) CKD  
6) DM f/u private GP JAN 2024 Referred from CVM for DM management  Labs 

Consultation with Patient:

- K 4.8 Cr 107 eGFR 63 A1c 8.5% from 8.0% 
- Current DM meds: sitagliptin 50mg OM empagliflozin 25mg OM gliclazide MR 60mg BD  levemir 10U bedtime 
- last 3 months  metformin XR 1g OM 
- came with wife checks BG but does not know readings says single digit no hypos c/o frequent urination still can cope with it but finds it irksome on frusemide and empa discussed continuing empa for glycemic, cardiorenal benefits may not give him that much relief if stopped, as remains on frusemide which overall has a greater diuretic effect and would lose out on the many benefits of empa

Plan:
- increase sitagliptin 100mg OM  
- increase metformin XR to 1.5g OM 
- switch levemir to lantus after completing last 2 pens 
- TCU 5/12, review labs done at NHC 9/9/24 

Sample Summary 2:

Medical History:
1) T2DM - not on metformin as felt unwell when on it (breathless) 
2) DM nephropathy 
3) Lipids 
4) Previous subtotal thyroidectomy - now hypothyroid on replacemnet 
5) Hypocalcemia - likely hypoparathyroidism following thyroid surgery 

Consultation with Patient:
- TSH 1.5 FT4 15.5
- S/B OPS June 2023 fundal photo done: normal  
- foot screen done: normal 
- FT4 10.7 TSH 2.28 normal Na 139 K 4.3 Cr 82 Glu 15.1 Corr Ca 2.05  
- A1c 8.0% from 7.2% takes home BP: usually 130+ but sometimes up to 150-160+ when anxious morning BG 7.5-8.5 not willing to increase meds for DM and BP wants to keep everything status quo allowed to ventilate
- has trouble sleeping, extremely lonely, nobody to talk to, feels like everything in the media is geared towards younger people and that she has been left behind

Plan:
- stop mecobalamin 
- keep rest same 
- TCU 9/12 `;
export default prompt_imed;
