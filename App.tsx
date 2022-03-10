import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, Button, TextInput } from 'react-native';
import { query, Task, createRecord, initIHPBackend } from 'ihp-backend';
import { useQuery, useCurrentUser } from 'ihp-backend/react';
import { useEffect, useState } from 'react';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import * as IHPBackend from 'ihp-backend';
import * as SecureStore from 'expo-secure-store';

//Update this to your own ihpbackend url:
const ihpBackend = { host: 'https://tjtsmsngkhrllmwhwfekgbbcsbhzavuo.di1337.com' }

initIHPBackend(ihpBackend);

export default function App() {
  // const tasks = useQuery(query('tasks'));
  const [isLoggedIn, setLoggedIn] = useState(false);

  useEffect(async () => {
    const url = AuthSession.makeRedirectUri();
    const result = await WebBrowser.openAuthSessionAsync(ihpBackend.host + '?redirectBack=' + encodeURIComponent(url), url);
    if (result.type === 'success') {
      const userId = getUrlParameter(result.url, 'userId');
      const accessToken = getUrlParameter(result.url, 'accessToken');
      const jwt = await IHPBackend.fetchJWT(userId, accessToken);
      SecureStore.setItemAsync('ihp_jwt', jwt);

      window.localStorage = {
        getItem: (key) => {
          if (key === 'ihp_jwt') {
            return jwt;
          }
        },
        removeItem: (key) => {
          return null;
        }
      }

      await IHPBackend.initAuth();
      // localStorage.setItem('ihp_jwt', jwt);
      console.log('JWT', jwt);
      setLoggedIn(true);
    }
  });

  return (
    <View style={styles.container}>
      <Text>{isLoggedIn ? <Tasks/> : 'not logged in'}</Text>
      {isLoggedIn && <NewTaskButton/>}

      <StatusBar style="auto" />
    </View>
  );
}

function Tasks() {
  const user = useCurrentUser();
  const tasks = useQuery(query('tasks'));

  if (tasks === null) {
    return <Text>Loading ...</Text>
  }

  return <View>
    {tasks.map(task => <TaskItem key={task.id} task={task} />)}
  </View>
}

interface TaskProps {
  task: Task;
}

function TaskItem({ task }: TaskProps) {
  return <View><Text>{task.title}</Text></View>
}

function NewTaskButton() {
  const [title, setTitle] = useState('');
  const [isLoading, setLoading] = useState(false);

  async function onPressAddTask() {
    setLoading(true);
    await createRecord('tasks', { title, userId: IHPBackend.getCurrentUserId()});
    setTitle('');
    setLoading(false);
  }

  return <View>
    <TextInput style={styles.input} onChangeText={setTitle} value={title} />
    <View>
      <Button onPress={onPressAddTask} title="Add Task" disabled={isLoading}/>
    </View>
  </View>
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    height: 40,
    minWidth: 200,
    margin: 12,
    borderWidth: 1,
    padding: 10,
  },
});

function getUrlParameter(url: string, name: string) {
  name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
  var regex = new RegExp('[\\?&]' + name + '=([^&#]*)');
  var results = regex.exec(url);
  return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
};
