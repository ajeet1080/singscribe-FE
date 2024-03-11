import React, { useEffect, useState, useRef } from "react";

import {
  TextAnalyticsClient,
  AzureKeyCredential,
} from "@azure/ai-text-analytics";
import CryptoJS from "crypto-js";
import {
  Button,
  useToast,
  Box,
  Text,
  Textarea,
  VStack,
  HStack,
  Spinner,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  useColorModeValue,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  RadioGroup,
  Stack,
  Radio,
  Input,
} from "@chakra-ui/react";

import shslogo from "../assets/singhealth-logo.png";
import shsdividerlogo from "../assets/shs-divider.png";
import shsbackground from "../assets/SingScribe_Design.png";
import soundwave from "../assets/soundwave.gif";
import {
  ConversationTranscriber,
  SpeechConfig,
  AudioConfig,
} from "microsoft-cognitiveservices-speech-sdk";
import { CosmosClient } from "@azure/cosmos";

useColorModeValue;

const UserRecording: React.FC = () => {
  const [recording, setRecording] = useState<boolean>(false);
  const [summary, setSummary] = useState<string>(""); // State for the summary text
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const toast = useToast();
  const [isLoadingTranscript, setIsLoadingTranscript] =
    useState<boolean>(false);
  const [isLoadingSummary, setIsLoadingSummary] = useState<boolean>(false);
  const [formattedTranscript, setFormattedTranscript] = useState("");
  const [transcription, setTranscription] = useState<
    { speakerId: string; text: string }[]
  >([]);
  const [encryptedTranscript, setEncryptedTranscript] = useState("");
  const [conversationTranscriber, setConversationTranscriber] =
    useState<ConversationTranscriber | null>(null);
  const [languageSelected, setLanguageSelected] = useState(false);
  const [language, setLanguage] = useState("en-SG");
  const [isOpen, setIsOpen] = useState(true);
  const onClose = () => setIsOpen(false);
  const [isEditing, setIsEditing] = useState(false); // State for the editing mode
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [timer, setTimer] = useState(0);
  const [timerInterval, setTimerInterval] = useState<NodeJS.Timeout | null>(
    null
  );
  const [isGenerateLoading, setGenerateLoading] = useState<boolean>(false);

  const rawTranscriptRef = useRef<HTMLDivElement | null>(null);
  const summaryRef = useRef<HTMLDivElement | null>(null);
  const [summaryText, setSummaryText] = useState<string>("");
  const [formattedText, setFormattedText] = useState<string>("");
  const [uCode, setUCode] = useState<string>("");

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSave = () => {
    setIsEditing(false);
  };

  const toggleRecording = async () => {
    if (recording) {
      await stopRecording();
    } else {
      await startRecording();
    }
  };

  useEffect(() => {
    if (languageSelected) {
      onClose();
    }
  }, [language]);

  const handleLanguageChange = (value: string) => {
    setLanguage(value);
    setLanguageSelected(true);
  };

  const handleLogin = () => {
    // Simple authentication check (in a real app, you would check against a server)
    if (userId.trim() === "user01" && password.trim() === "SingHealth123$") {
      setIsAuthenticated(true);
    } else {
      toast({
        title: "Authentication failed",
        description: "Please enter a valid user ID and password.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const startRecording = async () => {
    try {
      const speechConfig = SpeechConfig.fromSubscription(
        "e5404bd89ea14c388c2c17234f95e36a",
        "southeastasia"
      );
      speechConfig.speechRecognitionLanguage = language;
      const audioConfig = AudioConfig.fromDefaultMicrophoneInput();
      const transcriber = new ConversationTranscriber(
        speechConfig,
        audioConfig
      );

      transcriber.transcribed = (
        s: any,
        e: { result: { text: string; speakerId: string } }
      ) => {
        setTranscription((prevTranscription) => [
          ...prevTranscription,
          { speakerId: e.result.speakerId, text: e.result.text },
        ]);
      };

      await transcriber.startTranscribingAsync();
      setConversationTranscriber(transcriber);
      setRecording(true);

      // Start the timer
      const interval = setInterval(() => {
        setTimer((prevTimer) => prevTimer + 1);
      }, 1000);
      setTimerInterval(interval);
      // Display toast message for starting recording
      toast({
        title: "Recording has started",
        status: "info",
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: "Error starting recording",
        description:
          "Failed to start recording. Please ensure your microphone is working.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const cosmosClient = new CosmosClient({
    endpoint: "https://singscribe-cosmosdb.documents.azure.com:443/",
    key: "SjcL1sPNRelpz9IyBzXL1Aww9smwQALhmPxGikKauJ8H0C1CzXQU3SZ09Scfyg85CxQcPrWNAmS8ACDb2jcm4Q==",
  });

  const databaseId = "notebuddy";
  const containerId = "summaries";

  const generateUniqueCode = () => {
    // Implement your code generation logic here
    // For simplicity, we'll use a random number as an example

    setUCode(Math.random().toString(36).substr(2, 9));
    return uCode;
  };

  // Function to save transcript and summary to Cosmos DB
  const saveToCosmosDB = async (summary: string, transcript: string) => {
    const { database } = await cosmosClient.databases.createIfNotExists({
      id: databaseId,
    });
    const { container } = await database.containers.createIfNotExists({
      id: containerId,
    });

    const querySpec = {
      query: "SELECT VALUE MAX(c.id) FROM c",
    };

    const { resources: items } = await container.items
      .query(querySpec)
      .fetchAll();

    const lastId = items[0];
    const newId = lastId !== null ? String(Number(lastId) + 1) : "1";
    setUCode(newId);

    const uniqueCode = newId; // Implement this function to generate a unique code

    // Save the data
    const { resource: createdItem } = await container.items.create({
      id: uniqueCode,
      summary,
      transcript,
      updatedSummary: "",
    });

    // Return the unique code so it can be shared
    return uniqueCode;
  };

  const stopRecording = async () => {
    if (conversationTranscriber) {
      await conversationTranscriber.stopTranscribingAsync();
      setConversationTranscriber(null);
    }
    setRecording(false);
    setIsLoading(true);
    setIsLoadingSummary(true);
    setIsLoadingTranscript(true);
    await transcribeAudio();
    setGenerateLoading(true);
  };

  const handleGenerate = async () => {
    try {
      const uniqueCode = await saveToCosmosDB(summary, formattedTranscript);
      // Do something with the uniqueCode, like showing it to the user
      toast({
        title: "Data saved",
        description: `Your data has been saved with code: ${uniqueCode}`,
        status: "success",
        duration: 5000,
        isClosable: true,
      });
    } catch (error) {
      console.error("Error saving to Cosmos DB:", error);
      toast({
        title: "Error saving data",
        description: "Failed to save data to Cosmos DB.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const transcribeAudio = async () => {
    const transcript = transcription
      .map((t) => `${t.speakerId}: ${t.text}`)
      .join("\n");
    // setIsLoading(true);
    setIsLoading(true);
    const textAnalyticsClient = new TextAnalyticsClient(
      "https://text-analytics-demo1.cognitiveservices.azure.com/",
      new AzureKeyCredential("f0c9555dd72f452192efd53cdf422996")
    );

    const encryptresponse = await textAnalyticsClient.recognizePiiEntities(
      [transcript],
      "en"
    );
    if (timerInterval) {
      clearInterval(timerInterval);
    }
    setTimerInterval(null);
    setTimer(0);
    const res = encryptresponse[0]; // Assuming one document is sent
    if ("error" in res && res.error !== undefined) {
      throw new Error(res.error.message);
    }
    let encryptedText = transcript;
    const entities = res.entities
      .filter(
        (entity) =>
          entity.category === "Person" ||
          entity.category === "SGNationalRegistrationIdentityCardNumber" ||
          entity.category === "Email" ||
          entity.category === "PhoneNumber" ||
          entity.category === "Address"
      )
      .map((entity) => {
        // Encrypt only Person and Email PII entities
        const encryptedValue = CryptoJS.AES.encrypt(
          entity.text,
          "secret key 123"
        ).toString();
        // Replace these PII entities with encrypted values
        encryptedText = encryptedText.replace(
          new RegExp(entity.text, "g"),
          encryptedValue
        );
      });
    setEncryptedTranscript(encryptedText);

    try {
      const response = await fetch(
        "https://shplayground2.openai.azure.com/openai/deployments/4Base/chat/completions?api-version=2023-07-01-preview",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "api-key": "fefc20d1c3ee4046b446c239f96e4fc4",
          },
          body: JSON.stringify({
            messages: [
              {
                role: "system",
                content: `You will receive a conversation transcript between a doctor and a patient in either English, Mandarin, Indonesian, or Tamil. Your task is to summarize the transcript in English, ensuring that it is easily comprehensible. Please refrain from adding any information not included in the original transcript.
                  Your summary should incorporate the following sections: Problem, Medical history, Medications, Allergies, Family history, Social history, Physical exam, Assessment, Plan.
                  Please use HTML markup to structure your summary. Highlight with HTML markup as <b style='color: #4d4d4d; font-weight: bold; font-size: 19px;'>Section Heading </b> tag for each section heading. Make sure there are no syntax errors in your generated HTML markup. Highlight crucial medical information like diagnoses and medicine names using the <b style='color: red; font-weight: bold; font-size: 18px;'> tag.
                  Follow the section headings and their order provided in the Sample Summary below, starting with the Problem. Ensure there is a line break at the end of each section. Show only those sections from below sample summary for which data input is available.
                  
                  Sample Summary:
                  <b> Problem </b> <br/>
                  The patient presented with a <b>headache<b>.<br/>
                  <b> Medical history </b> <br/>
                  The patient has a <b>history of migraines<b>.<br/>
                  <b> Medications </b> <br/>
                  The patient is currently taking <b>paracetamol<b>.<br/>
                  <b> Allergies</b> <br/>
                  The patient is <b>allergic to penicillin<b>.<br/>
                  <b> Family history</b> <br/>
                  The patient's mother has a history of migraines.<br/>
                  <b> Social history</b> <br/>
                  The patient is a non-smoker.<br/>
                  <b> Physical exam</b> <br/>
                  The patient's blood pressure is 120/80.<br/>
                  <b> Assessment</b> <br/>
                  The patient has a <b> migraine <b> <br/>
                  <b> Plan </b> <br/>
                  The patient is to <b> take paracetamol <b> and see doctor in 2 weeks. <br/>`,
              },
              {
                role: "assistant",
                content: encryptedText,
              },
            ],
            temperature: 0.2,
            top_p: 1,
            max_tokens: 1000,
            stream: true,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      if (response.body) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder("utf-8");
        while (true) {
          const chunk = await reader.read();
          const { done, value } = chunk;
          if (done) {
            break;
          }
          const decodedChunk = decoder.decode(value);
          const lines = decodedChunk.split("\n");
          const nonEmptyLines = lines.filter(
            (line) => line !== "" && line !== "[DONE]"
          );
          const parsedLines = nonEmptyLines
            .filter((line) => {
              try {
                JSON.parse(line.replace(/^data: /, ""));
                return true;
              } catch {
                return false;
              }
            })
            .map((line) => JSON.parse(line.replace(/^data: /, "")));
          for (const parsedLine of parsedLines) {
            const { choices } = parsedLine;

            if (choices && choices.length > 0) {
              const { delta } = choices[0];

              if (delta) {
                setSummary((currentSummary) =>
                  currentSummary
                    ? `${currentSummary}${delta.content}`
                    : delta.content
                );
                setIsLoadingSummary(false);
              }
            }
          }
        }
      }
      setSummaryText(summary);
    } catch (error) {
      console.error("Error:", error);
    }

    try {
      const response = await fetch(
        "https://shplayground2.openai.azure.com/openai/deployments/4Base/chat/completions?api-version=2023-07-01-preview",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "api-key": "fefc20d1c3ee4046b446c239f96e4fc4",
          },
          body: JSON.stringify({
            messages: [
              {
                role: "system",
                content:
                  "You will be provided with a transcript of a conversation between a doctor and a patient in either of English, Mandarin, Indonesian or Tamil language. You need to reformat the transcript in English in a way that it is easy to read and understand. Please ensure to do proper tagging as Doctor, Patient. You can use any format provided in Sample Transcript below. Do not add any additional information to the transcript. Please replace encrypted text values with revelant masked values eg [Patient' Name] , [Patient's Email] , etc as applicable.  \n\nSample Transcript:\nDoctor: Hello, how are you?\nPatient: I am fine, thank you.\nDoctor: What brings you here today?\nPatient: I have a headache.\nDoctor: How long have you had it?\nPatient: For about a week.",
              },
              {
                role: "assistant",
                content: encryptedText,
              },
            ],
            temperature: 0.2,
            top_p: 1,
            max_tokens: 2500,
            stream: false,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const result = await response.json();
      setFormattedTranscript(result.choices[0].message.content);
      setIsLoadingTranscript(false);
    } catch (error) {
      console.error("Error:", error);
    }
    setFormattedText(formattedTranscript);
    setIsLoading(false);
  };

  const handleCopy = async () => {
    try {
      // Remove HTML tags from the summary before copying
      const plainTextSummary = summary.replace(/<[^>]+>/g, "");
      await navigator.clipboard.writeText(plainTextSummary);
      toast({
        title: "Summary copied",
        description: "The summary has been copied to clipboard.",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (err) {
      console.error("Failed to copy text: ", err);
      toast({
        title: "Copy failed",
        description: "Failed to copy the summary to clipboard.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  // Scroll the Raw Transcript box to the bottom when new transcription is added
  useEffect(() => {
    if (rawTranscriptRef.current) {
      rawTranscriptRef.current.scrollTop =
        rawTranscriptRef.current.scrollHeight;
    }
  }, [transcription]);

  // Scroll the Summary box to the bottom when new summary text is added
  useEffect(() => {
    if (summaryRef.current) {
      summaryRef.current.scrollTop = summaryRef.current.scrollHeight;
    }
  }, [summary]);

  useEffect(() => {
    return () => {
      if (timerInterval) {
        clearInterval(timerInterval);
      }
    };
  }, [timerInterval]);

  // Initialize Cosmos DB client

  return (
    <VStack
      spacing={2}
      p={4}
      style={{
        minHeight: "100vh",
        background: `url(${shsbackground}) no-repeat center center fixed`, // Set background image here
        backgroundColor: "#FDFCFA",
        backgroundSize: "contain", // Ensure it covers the whole page
        width: "100vw", // Ensure it spans the full width
      }}
    >
      {!isAuthenticated ? (
        <Box
          display="flex"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          textAlign="center"
          height="100vh"
          width="100vw"
          // bgImage={`url(${shsbackground})`}
          // bgPosition="center"
          // bgRepeat="no-repeat"
          // bgSize="cover"
        >
          <Box
            backgroundColor="rgba(255, 255, 255, 0.6)" // Semi-transparent white background
            p={8}
            borderRadius="md"
            boxShadow="lg"
          >
            <Text
              fontSize="2xl"
              fontWeight="bold"
              color="black"
              align="center"
              mb={4}
            >
              Login to Sing-Scribe
            </Text>
            <Input
              placeholder="User ID"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              mb={4}
            />
            <Input
              placeholder="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              mb={6}
            />
            <Button colorScheme="orange" onClick={handleLogin} width="full">
              Login
            </Button>
            <Text fontSize="sm" mt={4}>
              Note: Send email to oia@singhealth.com.sg for access
            </Text>
          </Box>
        </Box>
      ) : (
        <>
          <Modal isOpen={isOpen} onClose={onClose}>
            <ModalOverlay />
            <ModalContent>
              <ModalHeader>Select a language</ModalHeader>
              <ModalCloseButton />
              <ModalBody>
                <RadioGroup onChange={handleLanguageChange} value={language}>
                  <Stack direction="column">
                    <Radio value="en-SG">English</Radio>
                    <Radio value="zh-CN">Mandarin</Radio>
                    <Radio value="id-ID">Bahasa</Radio>
                    <Radio value="ta-IN">Tamil</Radio>
                  </Stack>
                </RadioGroup>
              </ModalBody>
              <ModalFooter>
                <Button colorScheme="blue" mr={3} onClick={onClose}>
                  Close
                </Button>
              </ModalFooter>
            </ModalContent>
          </Modal>
          <HStack spacing={4} width="100%" justifyContent="center">
            <Button
              colorScheme={recording ? "blue" : "orange"}
              onClick={toggleRecording}
              marginTop={120}
            >
              {recording ? "Stop Recording" : "Start Recording"}
            </Button>

            <Button
              colorScheme={isGenerateLoading ? "green" : "white"}
              onClick={handleGenerate}
              marginTop={120}
            >
              {isGenerateLoading ? "Get code" : ""}
            </Button>
          </HStack>
          <Text fontSize="3xl" fontWeight="bold" color="blackAlpha.700">
            {uCode}
          </Text>

          {recording && (
            <>
              <img src={soundwave} alt="Soundwave" width="100" height="100" />
              <Text fontSize={25} fontWeight={"bold"} color={"orange"}>
                {Math.floor(timer / 3600)
                  .toString()
                  .padStart(2, "0")}
                :
                {Math.floor((timer % 3600) / 60)
                  .toString()
                  .padStart(2, "0")}
                :{(timer % 60).toString().padStart(2, "0")}
              </Text>
            </>
          )}
          <HStack spacing={4} width="100%">
            <Tabs
              flex="1"
              width="100%"
              height={600}
              p={3}
              borderRadius="md"
              boxShadow="lg"
              bg="white"
            >
              <Text fontSize="2xl" fontWeight="bold" color="#E54809">
                Transcript
              </Text>
              <TabList>
                <Tab _selected={{ color: "#E54809", borderColor: "#E54809" }}>
                  Raw Transcript
                </Tab>
                <Tab _selected={{ color: "#E54809", borderColor: "#E54809" }}>
                  Formatted Transcript
                </Tab>
              </TabList>
              <TabPanels>
                <TabPanel
                  ref={rawTranscriptRef}
                  width="100%"
                  height={475}
                  p={3}
                  borderRadius="md"
                  overflow="auto"
                >
                  {transcription.map((t, index) => (
                    <p
                      key={index}
                      style={{
                        color: t.speakerId === "Guest-1" ? "blue" : "red",
                      }}
                    >
                      {t.speakerId} : {t.text}
                    </p>
                  ))}
                </TabPanel>
                <TabPanel
                  width="100%"
                  height={475}
                  p={3}
                  borderRadius="md"
                  overflow="auto"
                >
                  {isLoadingTranscript ? (
                    <Spinner
                      label="Formating transcript, please wait..."
                      size="xl"
                      color="#E54809"
                    />
                  ) : (
                    formattedTranscript
                      .split("\n")
                      .filter((line) => line.trim() !== ":")
                      .map((line, index) => {
                        const [speaker, text] = line.split(": ");
                        return (
                          <p
                            key={index}
                            style={{
                              color: speaker === "Doctor" ? "blue" : "red",
                            }}
                          >
                            {speaker} : {text}
                          </p>
                        );
                      })
                  )}
                </TabPanel>
              </TabPanels>
            </Tabs>
            <Box
              ref={summaryRef}
              flex="1"
              width="100%"
              height={600}
              p={3}
              borderRadius="md"
              boxShadow="lg"
              bg="white"
            >
              <Text fontSize="2xl" fontWeight="bold" color="#E54809">
                Summary
              </Text>
              {isEditing ? (
                <Button onClick={handleSave} m={2}>
                  Save
                </Button>
              ) : (
                <Button onClick={handleEdit} m={2}>
                  Edit (with HTML)
                </Button>
              )}{" "}
              <Button onClick={handleCopy} m={2}>
                Copy
              </Button>
              {isLoadingSummary ? (
                <Spinner size="xl" color="#E54809" />
              ) : isEditing ? (
                <Textarea
                  width="100%"
                  height={475}
                  p={3}
                  borderRadius="md"
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  overflow={"auto"}
                />
              ) : (
                <Box
                  width="100%"
                  height={475}
                  p={3}
                  borderRadius="md"
                  overflow={"auto"}
                  dangerouslySetInnerHTML={{
                    __html: summary,
                  }}
                />
              )}
            </Box>
          </HStack>
        </>
      )}
    </VStack>
  );
};

export default UserRecording;
