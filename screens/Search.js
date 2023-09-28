import React, { Component } from "react";
import { View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList } from "react-native";

//Aula 83: Importando o componente ListItem
import { Avatar, ListItem, Icon } from "react-native-elements";

//Aula 83: Importando o BD para ter registro do histórico
import db from  "../config";

export default class SearchScreen extends Component {
  //Aula 83: Criando uma matriz vazia no estado chamada: allTransactions (ela irá guardar todas as transações)
  constructor(props){
    super(props);
    this.state = {
      allTransactions: [],
      //Aula 84: Criar o estado de pesquisa "vazio", para permitir uma pesquisa. Estado da última transação visível 
      searchText: "",
      lastVisibleTransaction: null
    }
  }

  //Aula 83: Chamamos dentro de componentDidMount, pois queremos obter os dados assim que o componente for carregado
  componentDidMount = async () => {
    this.getTransactions();
  };

  //Aula 83: Função obtém as transações: Fazendo uma consulta na coleção: 'transactions' e armazená-las na matriz allTransacions
  getTransactions = () => {
    db.collection("transactions")
      .limit(10) //Aula 84: Função limite para limitar para carregarn apenas as 10 últimas transações.
      .get()
      .then(snapshot => {
        snapshot.docs.map(doc => {
          this.setState({
            allTransactions: [...this.state.allTransactions, doc.data()],
            lastVisibleTransaction: doc
          });
        });
      });
  };

  /* 
  >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>> Aula 83 <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<< 
  >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>> FUNÇÃO renderItem  <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<< 
   - 1º) Converte-se o registro de data/hora em uma string legível qdo livro estiver sendo emprestado ou devolvido
         Para converter este dado usa-se a função split() que divide a string em uma matriz e separa os índices
         usando a função splice(). Por fim, junta-se todos os índices usando o método join  
  */
  renderItem = ({ item, i }) => {
    var date = item.date //Exemplo: 063806719297.191000000. Gera uma data em formato timestamp. 
      .toDate() //Exemplo: Thu Dec 15 2022 13:41:37 GMT-0300 (Horário Padrão de Brasília). Converte o timestamp para data. 
      .toString() //Exemplo: Thu Dec 15 2022 13:41:37 GMT-0300 (Horário Padrão de Brasília). Converte o tipo da variável para string (necessário para os próximos comandos funcionarem). 
      .split(" ") //Exemplo: Thu,Dec,15,2022,13:41:37,GMT-0300,(Horário,Padrão,de,Brasília). Tira os espaços e substitui por vírgula. 
      .splice(0, 4) //Exemplo: Thu,Dec,15,2022. A partir do 0, conta 4 e deleta tudo depois. 
      .join(" "); //Exemplo: Thu Dec 15 2022. Junta os itens inserindo espaço entre eles. 

    //Aula 83: Variável que irá verificar o tipo de transação. SE IGUAL "issue" = livro entregue/emprestado, SENÃO: livro devolvido
    var transactionType = item.transaction_type === "issue" ? "entregue" : "devolvido";

    //Aula 83: Na função return usando o component ListItem, cria-se uma UI (Interface do Usuário) p/ lista transações
    return (
      <View style={{ borderWidth: 1 }}>
        <ListItem key={i} bottomDivider>
          <Icon type={"antdesign"} name={"book"} size={40} />
          <ListItem.Content>
            <ListItem.Title style={styles.title}>
              {`${item.book_name} ( ${item.book_id} )`}
            </ListItem.Title>
            <ListItem.Subtitle style={styles.subtitle}>
              {`Este livro foi ${transactionType} por ${item.student_name}`}
            </ListItem.Subtitle>
            
            <View style={styles.lowerLeftContaiiner}>
              <View style={styles.transactionContainer}>
                <Text style={[styles.transactionText, { color: item.transaction_type === "issue"
                        ? "#78D304"
                        : "#0364F4" 
                      }]}
                >
                  { item.transaction_type.charAt(0).toUpperCase() + item.transaction_type.slice(1) }
                </Text>
                <Icon
                  type={"ionicon"}
                  name={ item.transaction_type === "issue"
                        ? "checkmark-circle-outline"
                        : "arrow-redo-circle-outline"
                      }
                  color={ item.transaction_type === "issue"
                        ? "#78D304" 
                        : "#0364F4"
                      }
                />
              </View>
              <Text style={styles.date}> {date} </Text>
            </View>
          </ListItem.Content>
        </ListItem>
      </View>
    );
  };

  //Aula 83: Função: Gerenciar de Pesquisa, usando o parâmetro de texto ela pesquisa todas as transações registras no banco de dados BD  
  handleSearch = async text => {
    //Deve-se obter o primeiro caracter e convertê-lo em maiúscula usando: toUpperCase()
    var enteredText = text.toUpperCase().split("");
    text = text.toUpperCase();
    this.setState({
      allTransactions: []
    });
    if(!text){
      this.getTransactions();
    }
    //IDENTIFICANDO O TIPO DE CÓDIGO:
    //SE o texto inserido começar com a letra 'B', faremos a consulta em allTransactions sobre ID Livro
    if(enteredText[0] === "B"){
      db.collection("transactions")
        .where("book_id", "==", text)
        .get()
        .then(snapshot => {
          snapshot.docs.map(doc => {
            this.setState({
              allTransactions: [...this.state.allTransactions, doc.data()],
              lastVisibleTransaction: doc
            })
          })
        })
    }
    //Definir a busca caso seja S (student)
    else if(enteredText[0] === "S"){
      db.collection("transactions")
        .where("student_id", "==", text)
        .get()
        .then(snapshot => {
          snapshot.docs.map(doc => {
            this.setState({
              allTransactions: [...this.state.allTransactions, doc.data()],
              lastVisibleTransaction: doc
            })
          })
        })
    }
  }

  //Aula 84 - Desafio 01: Fazer a função de "Buscar mais transações" usando o carregamento lento (com o limite de 10).
  // Faz-se igual na função handleSearch(), somente com algumas mudanças e limite de 10 transações
  // Usa-se a função startAfter() (começar depois de), para começão a obter as transações apartir da última.
  fetchMoreTransactions = async text => {
    var enteredText = text.toUpperCase().split("");
    text = text.toUpperCase();

    const {lastVisibleTransaction, allTransactions} = this.state;    
    if(enteredText[0] === "B"){
      db.collection("transactions")
        .where("book_id", "==", text)
        .orderBy("date", "desc")
        .startAfter(lastVisibleTransaction)
        .limit(10)
        .get()
        .then(snapshot => {
          snapshot.docs.map(doc => {
            this.setState({
              allTransactions: [...this.state.allTransactions, doc.data()],
              lastVisibleTransaction: doc
            });
          });
        });
    } //Definir a busca caso seja S (student)
    else if(enteredText[0] === "S"){
      db.collection("transactions")
        .where("student_id", "==", text)
        .orderBy("date", "desc")
        .startAfter(lastVisibleTransaction)
        .limit(10)
        .get()
        .then(snapshot => {
          snapshot.docs.map(doc => {
            this.setState({
              allTransactions: [...this.state.allTransactions, doc.data()],
              lastVisibleTransaction: doc
            });
          });
        });
    } 
  }
  
 /* 
  >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>> Aula 83 <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<< 
  >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>> FLATLIST <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<< 
  FlatList: Usado para listar todas as transações em formato de Lista. Ela tem 3 propriedades principais:
    - data (dados): contém todos os dados da matriz que precisam ser renderizados;
    - renderItem (renderizar item): Pega cada item da matriz de dados e o renderiza, retornando um componente JSX;
    - keyExtractor (extrator de chave): Fornece uma prop de chave exclusiva para cada item da lista (uma string).

    Aula 84: FlatList tem outras duas propriedades: que realizam a Lazy Loading (carregamento lento).
    Carregamento lento: Mostra apenas os itens essenciais (quantidade definida) e em seguida, libera o restante.
    - onEndReached (ao chegar ao fim): Chama uma função para obter mais documentos de transações depois que o último foi buscado
    - onEndThreshold (no limite final): Define quando queremos chamar a função dentro da propriedade onEndReached.
      Se for 1, a função será chamada quando o usuário tiver percorrido a lista completamente. 
      Se for 0.5, a função será chamada quando o usuário tiver na metade do caminho durante a rolagem de itens.
  */
  render() {
    const { searchText, allTransactions } = this.state;
    return (
      <View style={styles.container}>
        <View style={styles.upperContainer}>
          <View style={styles.textinputContainer}>
            <TextInput
              style={styles.textinput}
              onChangeText={text => this.setState({ searchText: text })}
              placeholder={"Escreva aqui"}
              placeholderTextColor={"#FFFFFF"}
            />
            <TouchableOpacity
              style={styles.scanbutton}
              onPress={() => this.handleSearch(searchText)}
            >
              <Text style={styles.scanbuttonText}>Pesquisar</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.lowerContainer}>
          <FlatList
            data={allTransactions}
            renderItem={this.renderItem}
            keyExtractor={(item, index) => index.toString()}
            //Aula 84: 
            onEndReached={() => this.fetchMoreTransactions(searchText)}
            onEndReachedThreshold={0.7}
          />
        </View>
      </View>
    );
  }
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#5653D4"
  },
  upperContainer: {
    flex: 0.2,
    justifyContent: "center",
    alignItems: "center"
  },
  textinputContainer: {
    borderWidth: 2,
    borderRadius: 10,
    flexDirection: "row",
    backgroundColor: "#9DFD24",
    borderColor: "#FFFFFF"
  },
  textinput: {
    width: "57%",
    height: 50,
    padding: 10,
    borderColor: "#FFFFFF",
    borderRadius: 10,
    borderWidth: 3,
    fontSize: 18,
    backgroundColor: "#5653D4",
    color: "#FFFFFF"
  },
  scanbutton: {
    width: 100,
    height: 50,
    backgroundColor: "#9DFD24",
    borderTopRightRadius: 10,
    borderBottomRightRadius: 10,
    justifyContent: "center",
    alignItems: "center"
  },
  scanbuttonText: {
    fontSize: 20,
    color: "#0A0101",
  },
  lowerContainer: {
    flex: 0.8,
    backgroundColor: "#FFFFFF"
  },
  title: {
    fontSize: 20,
  },
  subtitle: {
    fontSize: 16,
  },
  lowerLeftContaiiner: {
    alignSelf: "flex-end",
    marginTop: -40
  },
  transactionContainer: {
    flexDirection: "row",
    justifyContent: "space-evenly",
    alignItems: "center"
  },
  transactionText: {
    fontSize: 20,

  },
  date: {
    fontSize: 12,
    paddingTop: 5
  }
});