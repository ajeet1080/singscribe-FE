const prompt_end = `You will receive a conversation transcript between an doctor and a patient from the Endocrinology clinic with conditions including Diabetes Management, Hyperthyroidism, Hypothyroidism, Osteoporosis and Thyroid Disorders. 
Your task is to format the transcript into clinical documentation. Do not add information not available in the original transcript or make assumptions.
Write the clinical documentation in the following format: 
- Current Issues / Problem List
- Occupation / Social History
- Test Results
- Medication
- Investigations Ordered 

Sample Summary 1:
Current Issues / Problem List:
(1) IGT/IFG now DM dx 2013 (2) post RAI hypothyroidism (3) hypt (4) mild dyslipidaemia.
Occupation / Social History:
NM at SGH A+E.
Test Results:
1st june 2023 BP 129/75mmHg  HR 60/min   (01-Jun-2023 09:23:19) Weight 65 kg  (01-Jun-2023 09:45:25) BMI 22.5 kg/m2 (01-Jun-2023 09:45:25) HBA1c, blood (03 May 2023 10:12 ) HBA1c, blood 7.9 %
Current Active Medications from current visit:
01/06/23, Atenolol  Tablet, 25 mg, PO, OM, 7 months 01/06/23, Dapagliflozin Tablet, 10 mg, PO, OM, 7 months 01/06/23, Levothyroxine Sodium [EUTHYROX] Tablet, 100 mcg, PO, 4 times per week, 7 months, mon-thur and 01/06/23, Levothyroxine Sodium [EUTHYROX] Tablet, 125 mcg, PO, 3 times per week, 7 months, on fri-sun 01/06/23, MetFORMIN HCl XR Extended Release Tablet, 1500 mg, PO, ON, 7 months 01/06/23, Simvastatin Tablet, 10 mg, PO, ON, 7 months.
Investigations Ordered:
1. Thyroid Panel (FT4/TSH) 2. HBA1c, blood 3. Albumin/Creatinine Ratio, urine 4. Renal Panel (U/E/BICARB/GLU/CRE) with CKD-EPI eGFR, serum 5. Lipid Panel (CHO/HDL/TG/LDLc) 6. ECG (12-Lead)<br/>

Sample Summary 2:
Current Issues / Problem List:
IGT - frank DM 2018 going for triple bypass in July 2018 also has long standing graves on long term low dose carbimazole- OFF CBZ Feb 2019 Vit D deficiency 24 NOV 2022
Occupation / Social History:
very busy with work
Test Results:
Albumin/Creatinine Ratio, urine (19 Nov 2022 11:01 ) Albumin/Creatinine RESULT FOR ALBUMIN/CREATININE RATIO CANNOT BE RELIABLY  CALCULATED BECAUSE ALBUMIN,URINE IS BELOW THE DETECTION  LIMIT OF THE ASSAY  HBA1c, blood (19 Nov 2022 11:01 ) HBA1c, blood 7.5 % Thyroid Panel (FT4/TSH) (19 Nov 2022 11:01 ) Thyroxine  (T4) Free, serum 12.2 PMOL/L Thyroid Stimulating Hormone, serum 1.27 MU/L 1 JUNE 2023 has RHC pain - ? gall stone HBA1c, blood (18 Mar 2023 10:44 )HBA1c, blood 7.3 %HBA1c, blood (20 May 2023 10:11 )HBA1c, blood 7.5 %Lipid Panel (CHO/HDL/TG/LDLc) (20 May 2023 10:11 )Cholesterol LDL, Calc 3.25 MMOL/L     OPTIMAL LEVEL < 2.60 MMOL/L  DESIRABLE LEVEL  2.60 - 3.30 MMOL/LRenal Panel (CRE) with CKD-EPI eGFR, serum (20 May 2023 10:11 )CKD-EPI eGFR 93 CKDEPI eGFR Reporting units are: ML/MIN/1.73m2Serum creatinine is traceable to isotope dilution mass spectrometry (IDMS) reference measurement procedure.Thyroid Panel (FT4/TSH) (20 May 2023 10:11 )Thyroxine  (T4) Free, serum 11.2 PMOL/LThyroid Stimulating Hormone, serum 1.32 MU/L
Current Active Medications from current visit:
01/06/23, Aspirin  Tablet, 100 mg, PO, OM, 5 months 01/06/23, Colecalciferol  [Vitamin D3] Capsule/Tablet, 2000 unit, PO, OM, 5 months 01/06/23, Dapagliflozin Tablet, 10 mg, PO, OM, 5 months 01/06/23, MetFORMIN HCl XR Extended Release Tablet, 750 mg, PO, ON, 5 months 01/06/23, ThiamAZOLE Tablet, 5 mg, PO, 4 times per week, 5 months<br/>
Investigations Ordered:
1. US Abdomen 2. 25 Hydroxyvitamin D Total, serum 3. HBA1c, blood 4. Liver Panel (TP/ALB/TBIL/ALP/ALT/AST), serum 5. Lipid Panel (CHO/HDL/TG/LDLc) 6. Thyroid Panel (FT4/TSH)<br/>`;
export default prompt_end;
