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
  Checkbox,
  Select,
  Collapse,
  Heading,
  Container,
  ButtonGroup,
  Flex,
  FormControl,
  FormLabel,
  DrawerOverlay,
  Drawer,
  DrawerContent,
  DrawerBody,
  IconButton,
  Card,
  CardBody,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Spacer,
  Image,
  Tooltip,
  Icon,
  Center,
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
import prompt_general from "../prompts/general";
import prompt_end from "../prompts/end";
import prompt_uro from "../prompts/uro";
import prompt_imed from "../prompts/imed";
import clear_all from "../assets/clear_all.jpg";
import logo from "../assets/singhealth_logo_clear.png";
import { SmallCloseIcon, StarIcon, InfoOutlineIcon } from "@chakra-ui/icons";
import kanan from "../assets/login_kanan.png";

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
  const [formattedText, setFormattedText] = useState("");
  const [uCode, setUCode] = useState<string>("");
  const [userConsent, setUserConsent] = useState<boolean>(false);
  const [selectedSpeciality, setSelectedSpeciality] = useState<string>("");
  const [prompt, setPrompt] = useState<string>("");
  const [showPrompt, setShowPrompt] = useState(false);
  const [isSummaryUpdated, setIsSummaryUpdated] = useState<boolean>(false);

  const [showPromptModal, setShowPromptModal] = useState(false);

  const onClosePromptModal = () => setShowPromptModal(false);

  const [showVersionModal, setShowVersionModal] = useState(false);

  const onCloseVersionModal = () => setShowVersionModal(false);

  const [selectedTranscriptTab, setSelectedTranscriptTab] =
    useState<string>("Raw Transcript");

  const [uniqueCode, setUniqueCode] = useState<string>("");

  const [isRatingOpen, setIsRatingOpen] = useState<boolean>(false);

  const onCloseRatingDrawer = () => setIsRatingOpen(false);

  const [rating, setRating] = useState<number | null>(null);

  const [hover, setHover] = useState<number | null>(null);

  const [feedback, setFeedback] = useState<string>("");

  const [feedbackSubmit, setFeedbackSubmit] = useState<boolean>(false);
  const [isRegenerated, setIsRegenerated] = useState<boolean>(false);

  const [showConsentModal, setShowConsentModal] = useState(false);

  const onCloseConsentModal = () => setShowConsentModal(false);

  const [data, setData] = useState<any | null>(null);
  const [updatedSummary, setUpdatedSummary] = useState<string>("");

  const handlePromptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setPrompt(e.target.value);
  };
  const togglePrompt = () => {
    setShowPrompt(!showPrompt);
  };

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
    return false;
  };
  const handleUserConsent = () => {
    setUserConsent(!userConsent);
  };

  React.useEffect(() => {
    if (rawTranscriptRef.current) {
      rawTranscriptRef.current.scrollTop =
        rawTranscriptRef.current.scrollHeight;
    }
  }, [transcription]);

  React.useEffect(() => {
    if (summaryRef.current) {
      summaryRef.current.scrollTop = summaryRef.current.scrollHeight;
    }
  }, [summary]);

  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedSpeciality(event.target.value);

    let newPrompt = "";
    if (event.target.value === "END") {
      newPrompt = prompt_end;
    } else if (event.target.value === "URO") {
      newPrompt = prompt_uro;
    } else if (event.target.value === "GEN") {
      newPrompt = prompt_general;
    } else if (event.target.value === "IMED") {
      newPrompt = prompt_imed;
    } else {
      newPrompt = "No prompt selected.";
    }
    setPrompt(newPrompt);
  };

  const handleClearAll = () => {
    setSummary("");
    setTranscription([]);
    setFormattedTranscript("");
    setEncryptedTranscript("");
    setGenerateLoading(false);
    setTimer(0);
    setUCode("");
  };

  const endpoint = "https://notebuddy.documents.azure.com:443/";
  const key =
    "cZtjlbZbWX82tiybof7QeyKRHJtWmBJqzH1P32CvpYCXqfXSS798hnzkEai9ME7aIf7uv0yMS8qfACDbFCLKHQ==";
  const databaseId = "notebuddy";
  const containerId = "summaries";
  const cosmosClient = new CosmosClient({ endpoint, key });

  const handleLogin = async () => {
    try {
      // Initialize Cosmos DB client
      const cosmosDBClient = new CosmosClient({
        endpoint: "https://notebuddy.documents.azure.com:443/",
        key: "cZtjlbZbWX82tiybof7QeyKRHJtWmBJqzH1P32CvpYCXqfXSS798hnzkEai9ME7aIf7uv0yMS8qfACDbFCLKHQ==",
      });

      const databaseId = "notebuddy";
      const containerId = "users";

      // Get or create the database and container
      const { database } = await cosmosDBClient.databases.createIfNotExists({
        id: databaseId,
      });
      const { container } = await database.containers.createIfNotExists({
        id: containerId,
      });

      // Query for the user document
      const querySpec = {
        query: "SELECT * FROM c WHERE c.username = @username",
        parameters: [
          {
            name: "@username",
            value: userId, // Replace with the actual username
          },
        ],
      };

      const { resources: items } = await container.items
        .query(querySpec)
        .fetchAll();

      if (items.length > 0) {
        const user = items[0];
        if (user.password === password) {
          setIsAuthenticated(true);
        } else {
          toast({
            title: "Login failed",
            description: "Invalid password.",
            status: "error",
            duration: 5000,
            isClosable: true,
          });
        }
      } else {
        toast({
          title: "Login failed",
          description: "User not found.",
          status: "error",
          duration: 5000,
          isClosable: true,
        });
      }
    } catch (error) {
      console.error("Error while authenticating:", error);
      // Handle error (e.g., show an error message to the user)
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

  // Function to save transcript and summary to Cosmos DB
  async function saveToCosmosDB(summary: string, transcript: string) {
    const cosmosClient = new CosmosClient({
      endpoint: "https://notebuddy.documents.azure.com:443/",
      key: "cZtjlbZbWX82tiybof7QeyKRHJtWmBJqzH1P32CvpYCXqfXSS798hnzkEai9ME7aIf7uv0yMS8qfACDbFCLKHQ==",
    });

    const databaseId = "notebuddy";
    const containerId = "summaries";

    const generateUniqueCode = () => {
      // Implement your code generation logic here
      // For simplicity, we'll use a random number as an example

      setUCode(Math.random().toString(36).substr(2, 9));

      return uCode;
    };
    const { database } = await cosmosClient.databases.createIfNotExists({
      id: databaseId,
    });
    const { container } = await database.containers.createIfNotExists({
      id: containerId,
    });

    const querySpec = {
      query: "SELECT c.id FROM c",
    };

    const { resources: items } = await container.items
      .query(querySpec)
      .fetchAll();

    const ids = items.map((item) => Number(item.id));
    const maxId = Math.max(...ids);
    const newId = String(maxId + 1);
    setUCode(newId);

    // Save the data
    const { resource: createdItem } = await container.items.create({
      id: newId,
      user: userId,
      summary,
      transcript,
      updatedSummary: "",
      rating: null,
      feedback: "",
    });

    // Return the new id
    //return newId;
  }

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

  useEffect(() => {
    if (isGenerateLoading) {
      handleGenerate();
    }
  }, [isGenerateLoading]);

  useEffect(() => {
    if (isRegenerated) {
      handleGenerate();
    }
  }, [isRegenerated]);

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

  const regererateSummary = async () => {
    setIsRegenerated(false);
    setSummary("");
    setIsLoadingSummary(true);
    setSummaryText("");
    try {
      const response = await fetch(
        "https://singhealth-openai-03.openai.azure.com/openai/deployments/chat4/chat/completions?api-version=2024-02-15-preview",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "api-key": "f50c2f94adc443178fb2ddf07dd048ea",
          },
          body: JSON.stringify({
            messages: [
              {
                role: "system",
                content: prompt,
              },
              {
                role: "assistant",
                content: encryptedTranscript,
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
                // wait for 1 second
                await new Promise((resolve) => setTimeout(resolve, 100));
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
      setIsRegenerated(true);
    } catch (error) {
      console.error("Error:", error);
    }
  };

  async function transcribeAudio() {
    const transcript = transcription
      .map((t) => `${t.speakerId}: ${t.text}`)
      .join("\n");
    // setIsLoading(true);
    setIsLoading(true);

    let encryptedText = transcript;
    let detected_pii = [];

    setEncryptedTranscript(encryptedText);

    try {
      const encrypt_response = await fetch(
        "https://tandem01.azurewebsites.net/api/encrypt",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            transcript: transcript,
          }),
        }
      );
      if (!encrypt_response.ok) {
        throw new Error(`HTTP error! status: ${encrypt_response.status}`);
      }
      const encrypt_result = await encrypt_response.json();
      encryptedText = encrypt_result.encrypted_transcript;
      detected_pii = encrypt_result.identified_pii;
    } catch (error) {
      console.error("Error:", error);
    }

    try {
      const response = await fetch(
        "https://singhealth-openai-03.openai.azure.com/openai/deployments/chat4/chat/completions?api-version=2024-02-15-preview",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "api-key": "f50c2f94adc443178fb2ddf07dd048ea",
          },
          body: JSON.stringify({
            messages: [
              {
                role: "system",
                content: prompt,
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
                // wait for 1 second
                await new Promise((resolve) => setTimeout(resolve, 100));
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
        "https://singhealth-openai-03.openai.azure.com/openai/deployments/chat4/chat/completions?api-version=2024-02-15-preview",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "api-key": "f50c2f94adc443178fb2ddf07dd048ea",
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
      setFormattedText(result.choices[0].message.content);
    } catch (error) {
      console.error("Error:", error);
    }
    console.log("transcript", formattedText);
  }

  const handleCopy = async () => {
    try {
      // Remove HTML tags from the summary before copying
      const plainTextSummary = summary.replace(/<[^>]+>/g, "");
      await navigator.clipboard.writeText(plainTextSummary);
      setFeedback("");
      setRating(null);
      setFeedbackSubmit(false);
      setIsRatingOpen(true);

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
  const formatSummaryForDisplay = (summary: string) => {
    return summary.replace(/\n/g, "<br>");
  };

  const retrieveFromCosmosDB = async (uniqueCode: string) => {
    setSummary("");
    setFormattedTranscript("");
    setFormattedText("");
    setData(null);

    try {
      const { database } = await cosmosClient.databases.createIfNotExists({
        id: databaseId,
      });
      const { container } = await database.containers.createIfNotExists({
        id: containerId,
      });
      const querySpec = {
        query: "SELECT * FROM c WHERE c.id = @id",
        parameters: [
          {
            name: "@id",
            value: uniqueCode,
          },
        ],
      };
      const { resources } = await container.items.query(querySpec).fetchAll();
      if (resources && resources.length > 0) {
        setData(resources[0]);
        setSummary(
          resources[0].updatedSummary
            ? resources[0].updatedSummary
            : resources[0].summary
        );
        setFormattedText(resources[0].transcript);
        setFormattedTranscript(resources[0].transcript);
      } else {
        toast({
          title: "Data not found",
          description: "No data found with the provided ID.",
          status: "warning",
          duration: 3000,
          isClosable: true,
        });
        setData(null);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred while retrieving data.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      console.error("Error retrieving data from Cosmos DB", error);
    }
  };

  const updateSummaryInCosmosDB = async () => {
    // setData(null);
    setIsSummaryUpdated(false);

    if (!summary) {
      toast({
        title: "Error",
        description: "No data or updated summary to save.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });

      return;
    }

    try {
      const { database } = await cosmosClient.databases.createIfNotExists({
        id: databaseId,
      });
      const { container } = await database.containers.createIfNotExists({
        id: containerId,
      });

      const item = {
        id: data.id,
        ...data,
        updatedSummary: summary, // Update the summary field
      };
      const { resource } = await container.item(data.id).replace(item);

      toast({
        title: "Success",
        description: "Summary updated successfully in Cosmos DB.",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      setIsEditing(false); // Exit editing mode
      setUpdatedSummary(summary);
      setSummary(summary);
      // Update local state
      setIsSummaryUpdated(true);
      await retrieveFromCosmosDB(data.id);
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred while updating the summary.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      console.error("Error updating summary in Cosmos DB", error);
    }
  };

  // Save rating and feedback to Cosmos DB
  const saveRatingAndFeedback = async () => {
    if (!rating || !feedback) {
      toast({
        title: "Error",
        description: "Please provide a rating and feedback.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      const { database } = await cosmosClient.databases.createIfNotExists({
        id: databaseId,
      });
      const { container } = await database.containers.createIfNotExists({
        id: containerId,
      });
      const item = {
        id: data.id,
        ...data,
        rating: rating, // Update the summary field
        feedback: feedback,
      };
      const { resource } = await container.item(data.id).replace(item);
      setFeedbackSubmit(true);
      setIsRatingOpen(false);

      toast({
        title: "Success",
        description: "Rating and feedback saved successfully.",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      setIsRatingOpen(false);
      setFeedbackSubmit(true);
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred while saving rating and feedback.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      console.error("Error saving rating and feedback in Cosmos DB", error);
    }
  };

  return (
    <>
      {!isAuthenticated ? (
        <>
          <Flex height={"100vh"}>
            <Box w="50%">
              <Flex
                flexDirection={"column"}
                paddingX={"25%"}
                paddingY={"20%"}
                gap={8}
              >
                <Image src={logo} alt="logo" width={"96px"} />
                <Heading as="h1" size="3xl" color={"#DD6B20"}>
                  NoteBuddy
                </Heading>

                <Text color={"#717171"}>
                  Ambient digital scrive solution to converts Clinician-Patient
                  conversation to text, extracts relevant information, and
                  summarize s them to medical note.
                </Text>

                <VStack>
                  <FormControl>
                    <FormLabel>Email</FormLabel>
                    <Input
                      type="email"
                      value={userId}
                      onChange={(e: any) => setUserId(e.target.value)}
                    />
                  </FormControl>

                  <FormControl>
                    <FormLabel>Password</FormLabel>
                    <Input
                      type="password"
                      value={password}
                      onChange={(e: any) => setPassword(e.target.value)}
                    />
                  </FormControl>
                </VStack>

                <Button colorScheme="orange" onClick={handleLogin} width="full">
                  Sign In
                </Button>
              </Flex>
            </Box>
            <Center w="50%" backgroundColor={"#FFF3EB"}>
              <Image src={kanan} alt="Image logo of notebuddy" />
            </Center>
          </Flex>
          {showConsentModal && (
            <Modal
              isOpen={showConsentModal}
              size={"4xl"}
              onClose={onCloseConsentModal}
              isCentered={true}
            >
              <ModalOverlay />
              <ModalContent paddingY={"20px"}>
                <ModalHeader color={"#DD6B20"} fontWeight="bold">
                  Consent to Continue
                </ModalHeader>
                {/*<ModalCloseButton/>*/}
                <ModalBody>
                  <Checkbox
                    size="lg"
                    colorScheme="orange"
                    onChange={handleUserConsent}
                  >
                    The patient consented to be part of the pilot test for a
                    Generative AI powered assistive tool for clinical
                    documentation.
                  </Checkbox>
                </ModalBody>
              </ModalContent>
            </Modal>
          )}
        </>
      ) : (
        <>
          {/* User consent form after login */}
          {!userConsent && (
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
              <Box
                marginTop={150}
                p={8}
                borderRadius="md"
                boxShadow="lg"
                bg="white"
              >
                <Text fontSize="xl" fontWeight="bold" color="#E54809" mb={4}>
                  User Consent
                </Text>
                <Checkbox
                  size="lg"
                  colorScheme="orange"
                  onChange={handleUserConsent}
                >
                  <Text fontSize="lg">
                    The patient consented to be part of the pilot test for a
                    Generative AI powered assistive tool for clinical
                    documentation.
                  </Text>
                </Checkbox>
              </Box>
            </VStack>
          )}
          <Box backgroundColor="gray.100">
            {userConsent && (
              <>
                <Container centerContent maxW="container.xl">
                  <Flex
                    minWidth="100%"
                    marginY={"6"}
                    alignItems="center"
                    gap="2"
                  >
                    <Box>
                      <Heading size="md">
                        <Image src={logo} alt="logo" />
                      </Heading>
                    </Box>
                    <Spacer />

                    <Heading as="h1" size="xl" mb="0" color={"gray.500"}>
                      NoteBuddy
                    </Heading>

                    <Spacer />

                    <ButtonGroup gap="5">
                      <Button
                        colorScheme="black"
                        variant="link"
                        _hover={{ color: "#DD6B20" }}
                        onClick={() => setShowPromptModal(true)}
                        color={"gray.500"}
                      >
                        PROMPT SETTING
                      </Button>

                      <Button
                        colorScheme="black"
                        variant="link"
                        _hover={{ color: "#DD6B20" }}
                        onClick={handleClearAll}
                        color={"gray.500"}
                      >
                        NEW SESSION
                      </Button>

                      <Button
                        colorScheme="black"
                        variant="link"
                        _hover={{ color: "#DD6B20" }}
                        onClick={() => setShowVersionModal(true)}
                        color={"gray.500"}
                      >
                        VERSION HISTORY
                      </Button>

                      <Button
                        colorScheme="black"
                        variant="link"
                        _hover={{ color: "#DD6B20" }}
                        color={"gray.500"}
                      >
                        ACCOUNT
                      </Button>
                    </ButtonGroup>
                  </Flex>

                  <Card width={"100%"} borderRadius="md">
                    <CardBody>
                      <Flex minWidth="max-content" alignItems={"end"} gap="3">
                        <Flex width={"60%"} gap="3">
                          <FormControl>
                            <FormLabel>Select Specialty</FormLabel>
                            <Select
                              placeholder="Select speciality"
                              onChange={handleChange}
                            >
                              <option value="END">END</option>
                              <option value="URO">Urology</option>
                              <option value="IMED">Int Medicine</option>
                              <option value="GEN">General</option>
                            </Select>
                          </FormControl>

                          <FormControl>
                            <FormLabel>Select Language</FormLabel>
                            <Select
                              placeholder="Select Language"
                              onChange={(e) =>
                                handleLanguageChange(e.target.value)
                              }
                            >
                              <option value="en-SG">English</option>
                              <option value="zh-CN">Mandarin</option>
                              <option value="id-ID">Malay</option>
                              <option value="ta-IN">Tamil</option>
                            </Select>
                          </FormControl>
                          <FormControl>
                            <FormLabel>
                              Code{" "}
                              <Tooltip
                                label="Use below code to retrieve transcript and summary later from https://notebuddy-nonprd02.azurewebsites.net/. Use same credentials to login the url."
                                fontSize="sm"
                                background={"white"}
                                color={"black"}
                              >
                                <span>
                                  <Icon
                                    boxSize={5}
                                    ml={2}
                                    as={InfoOutlineIcon}
                                  />
                                </span>
                              </Tooltip>
                            </FormLabel>
                            <Input
                              placeholder="00"
                              value={uCode}
                              style={{
                                width: "30%",
                                color: "red",
                                fontWeight: "bold",
                                fontSize: "18px",
                              }}
                              disabled={true}
                            />
                          </FormControl>
                        </Flex>

                        <Spacer />

                        <Flex alignItems={"end"} gap={"3"}>
                          <Text
                            fontSize={18}
                            fontWeight="bold"
                            color="gray"
                            alignSelf={"center"}
                            display="flex"
                            gap={"1"}
                          >
                            <svg
                              viewBox="0 0 24 24"
                              fill="none"
                              width="18"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
                              <g
                                id="SVGRepo_tracerCarrier"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              ></g>
                              <g id="SVGRepo_iconCarrier">
                                <path
                                  d="M4.51555 7C3.55827 8.4301 3 10.1499 3 12C3 16.9706 7.02944 21 12 21C16.9706 21 21 16.9706 21 12C21 7.02944 16.9706 3 12 3V6M12 12L8 8"
                                  stroke="#717171"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                ></path>
                              </g>
                            </svg>
                            {recording
                              ? `${String(Math.floor(timer / 3600)).padStart(
                                  2,
                                  "0"
                                )}:${String(
                                  Math.floor((timer % 3600) / 60)
                                ).padStart(2, "0")}:${String(
                                  timer % 60
                                ).padStart(2, "0")}`
                              : "00:00:00"}
                          </Text>

                          <Button
                            colorScheme={recording ? "red" : "orange"}
                            variant={"outline"}
                            onClick={toggleRecording}
                            marginTop={0}
                          >
                            {recording ? "Stop Recording" : "Start Recording"}
                          </Button>
                        </Flex>
                      </Flex>
                    </CardBody>
                  </Card>

                  <Box
                    w="full"
                    p={4}
                    display="flex"
                    justifyContent="center"
                    flexDirection="column"
                    alignItems="center"
                  ></Box>

                  <HStack spacing={4} width="100%" alignItems="start">
                    <Card width={"50%"} height={"600px"}>
                      <CardBody>
                        <HStack mb={6} mt={3}>
                          <Flex gap={4}>
                            <svg
                              viewBox="0 0 24 24"
                              width={18}
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
                              <g
                                id="SVGRepo_tracerCarrier"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              ></g>
                              <g id="SVGRepo_iconCarrier">
                                <path
                                  d="M7 10L12 15L17 10"
                                  stroke="#000000"
                                  strokeWidth="1.5"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                ></path>
                              </g>
                            </svg>

                            <Menu>
                              <MenuButton>{selectedTranscriptTab}</MenuButton>
                              <MenuList>
                                <MenuItem
                                  as="button"
                                  onClick={() =>
                                    setSelectedTranscriptTab("Raw Transcript")
                                  }
                                >
                                  Raw Transcript
                                </MenuItem>
                                <MenuItem
                                  as="button"
                                  onClick={() =>
                                    setSelectedTranscriptTab(
                                      "Formatted Transcript"
                                    )
                                  }
                                >
                                  Formatted Transcript
                                </MenuItem>
                              </MenuList>
                            </Menu>
                          </Flex>
                        </HStack>

                        {selectedTranscriptTab === "Raw Transcript" ? (
                          <Box
                            width="100%"
                            height={475}
                            p={3}
                            borderRadius="md"
                            overflow="auto"
                            ref={rawTranscriptRef}
                          >
                            {transcription.map((t, index) => (
                              <p
                                key={index}
                                style={{
                                  color:
                                    t.speakerId === "Guest-1" ? "blue" : "red",
                                }}
                              >
                                {t.speakerId} : {t.text}
                              </p>
                            ))}
                          </Box>
                        ) : isLoadingTranscript ? (
                          <Spinner
                            label="Formating transcript, please wait..."
                            size="xl"
                            color="#E54809"
                          />
                        ) : (
                          <Box
                            width="100%"
                            height={475}
                            p={3}
                            borderRadius="md"
                            overflow="auto"
                          >
                            {formattedTranscript
                              .split("\n")
                              .filter((line) => line.trim() !== ":")
                              .map((line, index) => {
                                const [speaker, text] = line.split(": ");
                                return (
                                  <p
                                    key={index}
                                    style={{
                                      color:
                                        speaker === "Doctor" ? "blue" : "red",
                                    }}
                                  >
                                    {speaker} : {text}
                                  </p>
                                );
                              })}
                          </Box>
                        )}
                      </CardBody>
                    </Card>

                    <Card width={"50%"} height={"600px"}>
                      <CardBody>
                        <HStack mb={6} mt={3}>
                          <Heading
                            as="h3"
                            color={"#E54809"}
                            fontSize="lg"
                            fontWeight="bold"
                          >
                            Summary
                          </Heading>
                          <Spacer />

                          <Flex gap={4}>
                            {!isEditing ? (
                              <>
                                <Button
                                  colorScheme="black"
                                  variant="link"
                                  _hover={{ color: "#DD6B20" }}
                                  onClick={regererateSummary}
                                >
                                  <Flex gap={1}>
                                    <svg
                                      viewBox="0 0 16 16"
                                      xmlns="http://www.w3.org/2000/svg"
                                      fill="#000000"
                                      width={14}
                                    >
                                      <g
                                        id="SVGRepo_bgCarrier"
                                        strokeWidth="0"
                                      ></g>
                                      <g
                                        id="SVGRepo_tracerCarrier"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                      ></g>
                                      <g id="SVGRepo_iconCarrier">
                                        <path
                                          fill="#000000"
                                          d="M14.9547098,7.98576084 L15.0711,7.99552 C15.6179,8.07328 15.9981,8.57957 15.9204,9.12636 C15.6826,10.7983 14.9218,12.3522 13.747,13.5654 C12.5721,14.7785 11.0435,15.5888 9.37999,15.8801 C7.7165,16.1714 6.00349,15.9288 4.48631,15.187 C3.77335,14.8385 3.12082,14.3881 2.5472,13.8537 L1.70711,14.6938 C1.07714,15.3238 3.55271368e-15,14.8776 3.55271368e-15,13.9867 L3.55271368e-15,9.99998 L3.98673,9.99998 C4.87763,9.99998 5.3238,11.0771 4.69383,11.7071 L3.9626,12.4383 C4.38006,12.8181 4.85153,13.1394 5.36475,13.3903 C6.50264,13.9466 7.78739,14.1285 9.03501,13.9101 C10.2826,13.6916 11.4291,13.0839 12.3102,12.174 C13.1914,11.2641 13.762,10.0988 13.9403,8.84476 C14.0181,8.29798 14.5244,7.91776 15.0711,7.99552 L14.9547098,7.98576084 Z M11.5137,0.812976 C12.2279,1.16215 12.8814,1.61349 13.4558,2.14905 L14.2929,1.31193 C14.9229,0.681961 16,1.12813 16,2.01904 L16,6.00001 L12.019,6.00001 C11.1281,6.00001 10.6819,4.92287 11.3119,4.29291 L12.0404,3.56441 C11.6222,3.18346 11.1497,2.86125 10.6353,2.60973 C9.49736,2.05342 8.21261,1.87146 6.96499,2.08994 C5.71737,2.30841 4.57089,2.91611 3.68976,3.82599 C2.80862,4.73586 2.23802,5.90125 2.05969,7.15524 C1.98193,7.70202 1.47564,8.08224 0.928858,8.00448 C0.382075,7.92672 0.00185585,7.42043 0.0796146,6.87364 C0.31739,5.20166 1.07818,3.64782 2.25303,2.43465 C3.42788,1.22148 4.95652,0.411217 6.62001,0.119916 C8.2835,-0.171384 9.99651,0.0712178 11.5137,0.812976 Z"
                                        ></path>
                                      </g>
                                    </svg>
                                    Regenerate
                                  </Flex>
                                </Button>

                                <Button
                                  colorScheme="black"
                                  variant="link"
                                  _hover={{ color: "#DD6B20" }}
                                  onClick={handleCopy}
                                >
                                  <Flex gap={1}>
                                    <svg
                                      viewBox="0 0 24 24"
                                      fill="none"
                                      width={15}
                                      xmlns="http://www.w3.org/2000/svg"
                                    >
                                      <g
                                        id="SVGRepo_bgCarrier"
                                        strokeWidth="0"
                                      ></g>
                                      <g
                                        id="SVGRepo_tracerCarrier"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                      ></g>
                                      <g id="SVGRepo_iconCarrier">
                                        <path
                                          fillRule="evenodd"
                                          clipRule="evenodd"
                                          d="M21 8C21 6.34315 19.6569 5 18 5H10C8.34315 5 7 6.34315 7 8V20C7 21.6569 8.34315 23 10 23H18C19.6569 23 21 21.6569 21 20V8ZM19 8C19 7.44772 18.5523 7 18 7H10C9.44772 7 9 7.44772 9 8V20C9 20.5523 9.44772 21 10 21H18C18.5523 21 19 20.5523 19 20V8Z"
                                          fill="#0F0F0F"
                                        ></path>
                                        <path
                                          d="M6 3H16C16.5523 3 17 2.55228 17 2C17 1.44772 16.5523 1 16 1H6C4.34315 1 3 2.34315 3 4V18C3 18.5523 3.44772 19 4 19C4.55228 19 5 18.5523 5 18V4C5 3.44772 5.44772 3 6 3Z"
                                          fill="#0F0F0F"
                                        ></path>
                                      </g>
                                    </svg>
                                    Copy
                                  </Flex>
                                </Button>

                                <Button
                                  colorScheme="black"
                                  variant="link"
                                  _hover={{ color: "#DD6B20" }}
                                  onClick={handleEdit}
                                >
                                  <Flex gap={1}>
                                    <svg
                                      fill="#000000"
                                      viewBox="0 0 32 32"
                                      version="1.1"
                                      width="13"
                                      xmlns="http://www.w3.org/2000/svg"
                                    >
                                      <g
                                        id="SVGRepo_bgCarrier"
                                        strokeWidth="0"
                                      ></g>
                                      <g
                                        id="SVGRepo_tracerCarrier"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                      ></g>
                                      <g id="SVGRepo_iconCarrier">
                                        <path d="M30.133 1.552c-1.090-1.044-2.291-1.573-3.574-1.573-2.006 0-3.47 1.296-3.87 1.693-0.564 0.558-19.786 19.788-19.786 19.788-0.126 0.126-0.217 0.284-0.264 0.456-0.433 1.602-2.605 8.71-2.627 8.782-0.112 0.364-0.012 0.761 0.256 1.029 0.193 0.192 0.45 0.295 0.713 0.295 0.104 0 0.208-0.016 0.31-0.049 0.073-0.024 7.41-2.395 8.618-2.756 0.159-0.048 0.305-0.134 0.423-0.251 0.763-0.754 18.691-18.483 19.881-19.712 1.231-1.268 1.843-2.59 1.819-3.925-0.025-1.319-0.664-2.589-1.901-3.776zM22.37 4.87c0.509 0.123 1.711 0.527 2.938 1.765 1.24 1.251 1.575 2.681 1.638 3.007-3.932 3.912-12.983 12.867-16.551 16.396-0.329-0.767-0.862-1.692-1.719-2.555-1.046-1.054-2.111-1.649-2.932-1.984 3.531-3.532 12.753-12.757 16.625-16.628zM4.387 23.186c0.55 0.146 1.691 0.57 2.854 1.742 0.896 0.904 1.319 1.9 1.509 2.508-1.39 0.447-4.434 1.497-6.367 2.121 0.573-1.886 1.541-4.822 2.004-6.371zM28.763 7.824c-0.041 0.042-0.109 0.11-0.19 0.192-0.316-0.814-0.87-1.86-1.831-2.828-0.981-0.989-1.976-1.572-2.773-1.917 0.068-0.067 0.12-0.12 0.141-0.14 0.114-0.113 1.153-1.106 2.447-1.106 0.745 0 1.477 0.34 2.175 1.010 0.828 0.795 1.256 1.579 1.27 2.331 0.014 0.768-0.404 1.595-1.24 2.458z"></path>
                                      </g>
                                    </svg>
                                    Edit
                                  </Flex>
                                </Button>
                              </>
                            ) : (
                              <>
                                <Button
                                  colorScheme="black"
                                  variant="link"
                                  _hover={{ color: "#DD6B20" }}
                                  onClick={updateSummaryInCosmosDB}
                                >
                                  Save
                                </Button>

                                <Button
                                  colorScheme="black"
                                  variant="link"
                                  _hover={{ color: "#DD6B20" }}
                                  onClick={() => setIsEditing(false)}
                                >
                                  Cancel
                                </Button>
                              </>
                            )}
                          </Flex>
                        </HStack>

                        {isLoadingSummary ? (
                          <Spinner size="xl" color="#E54809" />
                        ) : isEditing ? (
                          <Textarea
                            width="100%"
                            height={"100%"}
                            p={3}
                            value={summary}
                            onChange={(e: any) => setSummary(e.target.value)}
                            overflow={"auto"}
                          />
                        ) : (
                          <Box
                            width="100%"
                            height={475}
                            p={3}
                            borderRadius="md"
                            overflow="auto"
                            ref={summaryRef}
                            dangerouslySetInnerHTML={{
                              //Define summary before calling split
                              __html: summary
                                ? summary
                                    .split("\n")
                                    .map((line) => `<p>${line}</br></p>`)
                                    .join("")
                                : "",
                            }}
                          />
                        )}
                      </CardBody>
                    </Card>
                  </HStack>

                  <Modal
                    isOpen={showPromptModal}
                    size={"4xl"}
                    onClose={onClosePromptModal}
                  >
                    <ModalOverlay />
                    <ModalContent>
                      <ModalHeader>Prompt Setting</ModalHeader>
                      <ModalCloseButton />
                      <ModalBody>
                        <Textarea
                          mt={4}
                          placeholder="Enter your prompt here..."
                          value={prompt}
                          onChange={(e: any) => setPrompt(e.target.value)}
                          size="sm"
                          resize="vertical"
                          borderRadius="md"
                          height={500}
                          p={2}
                        />

                        <VStack></VStack>
                      </ModalBody>

                      <ModalFooter gap={4}>
                        <Button variant="ghost" onClick={onClosePromptModal}>
                          Cancel
                        </Button>

                        <Button
                          colorScheme="orange"
                          mr={3}
                          onClick={onClosePromptModal}
                        >
                          Save
                        </Button>
                      </ModalFooter>
                    </ModalContent>
                  </Modal>

                  <Modal
                    isOpen={showVersionModal}
                    size={"md"}
                    onClose={onCloseVersionModal}
                  >
                    <ModalOverlay />
                    <ModalContent>
                      <ModalHeader>Version History</ModalHeader>
                      <ModalCloseButton />
                      <ModalBody>
                        <FormControl>
                          <FormLabel fontWeight={"normal"}>
                            Enter code to retrieve data from previous session
                            recording{" "}
                          </FormLabel>
                          <Input
                            placeholder="Code"
                            value={uCode}
                            onChange={(e: any) => setUCode(e.target.value)}
                          />
                        </FormControl>

                        <VStack></VStack>
                      </ModalBody>

                      <ModalFooter gap={4}>
                        <Button variant="ghost" onClick={onCloseVersionModal}>
                          Cancel
                        </Button>

                        <Button
                          colorScheme="orange"
                          mr={3}
                          onClick={() => retrieveFromCosmosDB(uCode)}
                        >
                          Submit
                        </Button>
                      </ModalFooter>
                    </ModalContent>
                  </Modal>

                  <Drawer
                    colorScheme={"orange"}
                    placement={"bottom"}
                    size={"md"}
                    onClose={onCloseRatingDrawer}
                    // closeOnOverlayClick={false}
                    isOpen={isRatingOpen}
                  >
                    <DrawerOverlay />
                    <DrawerContent>
                      <DrawerBody background={"#F9EEE6"}>
                        <Box marginY={5}>
                          {feedbackSubmit ? (
                            <Flex justifyContent={"space-evenly"}>
                              <Flex gap={5} alignItems={"center"}>
                                <Text fontWeight={"bold"}>
                                  Thanks for your feedback! 🙌
                                </Text>
                              </Flex>
                              <Box>
                                <IconButton
                                  icon={<SmallCloseIcon />}
                                  color={"gray.400"}
                                  onClick={onCloseRatingDrawer}
                                  _focus={{ boxShadow: "none" }}
                                  _hover={{ bg: "none" }}
                                  _active={{ bg: "none" }}
                                  aria-label={`close`}
                                  border="none"
                                  padding="0"
                                  background="none"
                                />
                              </Box>
                            </Flex>
                          ) : rating ? (
                            <Flex
                              flexDirection={"column"}
                              gap={2}
                              marginX={300}
                            >
                              <Text fontWeight={"bold"}>
                                Tell us what happened
                              </Text>
                              <Text>
                                Provide a brief explanation about your
                                experience with NoteBuddy
                              </Text>
                              <Textarea
                                placeholder="Enter your feedback here..."
                                value={feedback}
                                onChange={(e: any) =>
                                  setFeedback(e.target.value)
                                }
                                size="sm"
                                resize="vertical"
                                borderRadius="md"
                                rows={5}
                                shadow={"md"}
                                p={2}
                              />
                              <Box alignSelf={"end"}>
                                <Button
                                  colorScheme="orange"
                                  onClick={() => saveRatingAndFeedback()}
                                >
                                  Submit
                                </Button>
                              </Box>
                            </Flex>
                          ) : (
                            <Flex justifyContent={"space-evenly"}>
                              <Flex gap={5} alignItems={"center"}>
                                <Text fontWeight={"bold"}>
                                  How helpful was the summary and transcript?{" "}
                                </Text>
                                <Box>
                                  {[...Array(5)].map((_, i) => {
                                    const ratingValue = i + 1;
                                    return (
                                      <label key={i}>
                                        <input
                                          type="radio"
                                          name="rating"
                                          value={ratingValue}
                                          onClick={() => setRating(ratingValue)}
                                          style={{ display: "none" }}
                                        />
                                        <IconButton
                                          icon={<StarIcon />}
                                          color={
                                            ratingValue <= (hover || rating!)
                                              ? "#DD6B20"
                                              : "gray.400"
                                          }
                                          onClick={() => setRating(ratingValue)}
                                          onMouseEnter={() =>
                                            setHover(ratingValue)
                                          }
                                          onMouseLeave={() => setHover(null)}
                                          aria-label={`Star ${ratingValue}`}
                                          _focus={{ boxShadow: "none" }}
                                          _hover={{ bg: "none" }}
                                          _active={{ bg: "none" }}
                                          border="none"
                                          padding="0"
                                          background="none"
                                        />
                                      </label>
                                    );
                                  })}
                                </Box>
                              </Flex>
                              <Box>
                                <IconButton
                                  icon={<SmallCloseIcon />}
                                  color={"gray.400"}
                                  onClick={onCloseRatingDrawer}
                                  _focus={{ boxShadow: "none" }}
                                  _hover={{ bg: "none" }}
                                  _active={{ bg: "none" }}
                                  aria-label={`close`}
                                  border="none"
                                  padding="0"
                                  background="none"
                                />
                              </Box>
                            </Flex>
                          )}
                        </Box>
                      </DrawerBody>
                    </DrawerContent>
                  </Drawer>
                </Container>
              </>
            )}
          </Box>
        </>
      )}
    </>
  );
};

export default UserRecording;
