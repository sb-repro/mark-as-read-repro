import {
  createGroupChannelCreateFragment,
  createGroupChannelFragment,
  createGroupChannelListFragment,
  createNativeClipboardService,
  createNativeFileService,
  createNativeMediaService,
  SendbirdUIKitContainer,
  useConnection,
  useSendbirdChat,
} from '@sendbird/uikit-react-native';

import Clipboard from '@react-native-clipboard/clipboard';
import {CameraRoll} from '@react-native-camera-roll/camera-roll';
import Video from 'react-native-video';
import * as DocumentPicker from 'react-native-document-picker';
import * as FileAccess from 'react-native-file-access';
import * as ImagePicker from 'react-native-image-picker';
import * as Permissions from 'react-native-permissions';
import * as CreateThumbnail from 'react-native-create-thumbnail';
import * as ImageResizer from '@bam.tech/react-native-image-resizer';
import {
  NavigationContainer,
  useNavigation,
  useRoute,
} from '@react-navigation/native';
import {useGroupChannel} from '@sendbird/uikit-chat-hooks';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import { Pressable, Text, TextInput, View } from "react-native";
import React, { useEffect, useState } from "react";
import AsyncStorage from '@react-native-async-storage/async-storage';
import {Logger} from '@sendbird/uikit-utils';
import {GroupChannelHandler} from '@sendbird/chat/groupChannel';

Logger.setLogLevel('debug');

const ClipboardService = createNativeClipboardService(Clipboard);
const FileService = createNativeFileService({
  fsModule: FileAccess,
  permissionModule: Permissions,
  imagePickerModule: ImagePicker,
  mediaLibraryModule: CameraRoll,
  documentPickerModule: DocumentPicker,
});
const MediaService = createNativeMediaService({
  VideoComponent: Video,
  thumbnailModule: CreateThumbnail,
  imageResizerModule: ImageResizer,
});

const GroupChannelListFragment = createGroupChannelListFragment();
const GroupChannelCreateFragment = createGroupChannelCreateFragment();
const GroupChannelFragment = createGroupChannelFragment();

const GroupChannelListScreen = () => {
  const navigation = useNavigation<any>();
  return (
    <GroupChannelListFragment
      onPressCreateChannel={channelType => {
        // Navigate to GroupChannelCreate function.
        navigation.navigate('GroupChannelCreate', {channelType});
      }}
      onPressChannel={channel => {
        // Navigate to GroupChannel function.
        navigation.navigate('GroupChannel', {channelUrl: channel.url});
      }}
    />
  );
};

const GroupChannelCreateScreen = () => {
  const navigation = useNavigation<any>();

  return (
    <GroupChannelCreateFragment
      onCreateChannel={async channel => {
        // Navigate to GroupChannel function.
        navigation.replace('GroupChannel', {channelUrl: channel.url});
      }}
      onPressHeaderLeft={() => {
        // Go back to the previous screen.
        navigation.goBack();
      }}
    />
  );
};

const GroupChannelScreen = () => {
  const navigation = useNavigation<any>();
  const {params} = useRoute<any>();

  const {sdk} = useSendbirdChat();
  const {channel} = useGroupChannel(sdk, params.channelUrl);

  useEffect(() => {
    const handler = new GroupChannelHandler();
    handler.onReactionUpdated = (eventChannel, reactionEvent) => {
      console.log('onReactionUpdated', eventChannel, reactionEvent);
    };

    sdk.groupChannel.addGroupChannelHandler('handler_id', handler);

    return () => {
      sdk.groupChannel.removeGroupChannelHandler('handler_id');
    };
  }, []);

  if (!channel) return null;

  return (
    <GroupChannelFragment
      channel={channel}
      onChannelDeleted={() => {
        // Navigate to GroupChannelList function.
        navigation.navigate('GroupChannelList');
      }}
      onPressHeaderLeft={() => {
        // Go back to the previous screen.
        navigation.goBack();
      }}
      onPressHeaderRight={() => {
        // Navigate to GroupChannelSettings function.
        navigation.navigate('GroupChannelSettings', {
          channelUrl: params.channelUrl,
        });
      }}
    />
  );
};

const RootStack = createNativeStackNavigator();
const Navigation = () => {
  const {currentUser} = useSendbirdChat();

  return (
    <NavigationContainer>
      <RootStack.Navigator screenOptions={{headerShown: false}}>
        {!currentUser ? (
          <RootStack.Screen name={'SignIn'} component={SignInScreen} />
        ) : (
          <>
            <RootStack.Screen
              name={'GroupChannelList'}
              component={GroupChannelListScreen}
            />
            <RootStack.Screen
              name={'GroupChannelCreate'}
              component={GroupChannelCreateScreen}
            />
            <RootStack.Screen
              name={'GroupChannel'}
              component={GroupChannelScreen}
            />
          </>
        )}
      </RootStack.Navigator>
    </NavigationContainer>
  );
};

const SignInScreen = () => {
  const {connect} = useConnection();

  const [id, setId] = useState('NEW_USER_ID');

  return (
    <View style={{flex: 1, alignItems: 'center', justifyContent: 'center'}}>
      <TextInput value={id} onChangeText={setId} style={{ width:120, borderWidth:1}} />

      <Pressable
        style={{
          width: 120,
          height: 30,
          backgroundColor: '#742DDD',
          alignItems: 'center',
          justifyContent: 'center',
        }}
        onPress={async () => {
          await connect(id, {nickname: id});
        }}>
        <Text>{'Sign in'}</Text>
      </Pressable>
    </View>
  );
};

const App = () => {
  return (
    <SendbirdUIKitContainer
      appId={APP_ID}
      chatOptions={{
        localCacheStorage: AsyncStorage,
        enableAutoPushTokenRegistration: false,
      }}
      userProfile={{
        onCreateChannel() {},
      }}
      platformServices={{
        file: FileService,
        notification: {} as any,
        clipboard: ClipboardService,
        media: MediaService,
      }}>
      <Navigation />
    </SendbirdUIKitContainer>
  );
};

const APP_ID = '2D7B4CDB-932F-4082-9B09-A1153792DC8D';

export default App;
