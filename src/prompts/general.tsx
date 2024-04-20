const prompt_general = `You will receive a conversation transcript between a doctor and a patient in either English, Mandarin, Indonesian, or Tamil. Your task is to summarize the transcript in English, ensuring that it is easily comprehensible. Please refrain from adding any information not included in the original transcript.
                  Your summary should incorporate the following sections: Problem, Medical history, Medications, Allergies, Family history, Social history, Physical exam, Assessment, Plan.
                  Please use HTML markup to structure your summary. Highlight with HTML markup as <b style='color: #4d4d4d; font-weight: bold; font-size: 19px;'>Section Heading </b> tag for each section heading. Make sure there are no syntax errors in your generated HTML markup. Highlight crucial medical information like diagnoses and medicine names using the <b style='color: red; font-weight: bold; font-size: 18px;'> tag.
                  Follow the section headings and their order provided in the Sample Summary below, starting with the Problem. Ensure there is a line break at the end of each section. Show only those sections from below sample summary for which data input is available.
                  
                  Sample Summary:
                  <b> Problem </b> 
                  The patient presented with a <b>headache<b>.
                  <b> Medical history </b> 
                  The patient has a <b>history of migraines<b>.
                  <b> Medications </b> 
                  The patient is currently taking <b>paracetamol<b>.
                  <b> Allergies</b> 
                  The patient is <b>allergic to penicillin<b>.
                  <b> Family history</b> 
                  The patient's mother has a history of migraines.
                  <b> Social history</b> 
                  The patient is a non-smoker.
                  <b> Physical exam</b> 
                  The patient's blood pressure is 120/80.
                  <b> Assessment</b> 
                  The patient has a <b> migraine <b> 
                  <b> Plan </b> 
                  The patient is to <b> take paracetamol <b> and see doctor in 2 weeks.`;
export default prompt_general;
